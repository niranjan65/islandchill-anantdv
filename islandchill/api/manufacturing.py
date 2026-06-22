import frappe
from frappe import _


WORK_ORDER_FINAL_STATUSES = {"Completed", "Closed", "Stopped", "Cancelled"}


def _force_work_order_in_progress(work_order):
    """
    Force ERPNext Work Order status to In Process when the shop-floor flow has
    already issued material / started execution but ERPNext did not refresh the
    list status automatically.

    This is intentionally server-side so ERPNext, not React local state, becomes
    the source of truth.
    """
    if not work_order:
        return None

    if not frappe.db.exists("Work Order", work_order):
        frappe.throw(_("Work Order {0} not found").format(work_order))

    current_status = frappe.db.get_value("Work Order", work_order, "status")

    if current_status in WORK_ORDER_FINAL_STATUSES:
        return current_status

    if current_status != "In Process":
        frappe.db.set_value(
            "Work Order",
            work_order,
            "status",
            "In Process",
            update_modified=True,
        )
        frappe.db.commit()
        return "In Process"

    return current_status


@frappe.whitelist()
def force_work_order_in_progress(work_order):
    """
    Public API for frontend/manual repair.
    Use this only after material issue or job start is actually done.
    """
    status = _force_work_order_in_progress(work_order)
    return {
        "success": True,
        "work_order": work_order,
        "work_order_status": status,
    }


@frappe.whitelist()
def get_stock_entry_for_work_order(work_order):
    """
    Return the latest Draft Material Transfer for Manufacture Stock Entry
    linked to the given Work Order. Used by the frontend to reopen and edit
    the existing draft instead of creating duplicate Stock Entries.
    """
    if not work_order:
        frappe.throw(_("Work Order is required"))

    stock_entries = frappe.get_all(
        "Stock Entry",
        filters={
            "work_order": work_order,
            "stock_entry_type": "Material Transfer for Manufacture",
            "docstatus": 0,
        },
        fields=["name"],
        order_by="modified desc",
        limit=1,
    )

    if not stock_entries:
        return None

    doc = frappe.get_doc("Stock Entry", stock_entries[0].name)
    return doc.as_dict()


@frappe.whitelist()
def save_stock_entry_draft(work_order, company, posting_date, posting_time=None, items=None, stock_entry_name=None):
    """
    Create or update a Draft Stock Entry.
    This method does not submit the document.
    """
    if isinstance(items, str):
        items = frappe.parse_json(items)

    if not work_order:
        frappe.throw(_("Work Order is required"))

    if not company:
        frappe.throw(_("Company is required"))

    if not posting_date:
        frappe.throw(_("Posting Date is required"))

    if not items:
        frappe.throw(_("Stock Entry items are required"))

    if stock_entry_name:
        doc = frappe.get_doc("Stock Entry", stock_entry_name)

        if doc.docstatus != 0:
            frappe.throw(_("Only Draft Stock Entry can be edited"))

        doc.set("items", [])
    else:
        doc = frappe.new_doc("Stock Entry")
        doc.stock_entry_type = "Material Transfer for Manufacture"
        doc.purpose = "Material Transfer for Manufacture"
        doc.work_order = work_order

    doc.company = company
    doc.posting_date = posting_date
    doc.set_posting_time = 1

    if posting_time:
        doc.posting_time = posting_time

    for row in items:
        item_code = row.get("code") or row.get("item_code")
        qty = float(row.get("qty") or row.get("transfer_qty") or 0)

        if not item_code or qty <= 0:
            continue

        doc.append("items", {
            "item_code": item_code,
            "qty": qty,
            "transfer_qty": qty,
            "uom": row.get("unit") or row.get("uom"),
            "s_warehouse": row.get("sourceWarehouse") or row.get("s_warehouse"),
            "t_warehouse": row.get("targetWarehouse") or row.get("t_warehouse"),
        })

    if not doc.items:
        frappe.throw(_("No valid Stock Entry items found"))

    doc.save(ignore_permissions=False)
    frappe.db.commit()

    return {
        "success": True,
        "name": doc.name,
        "docstatus": doc.docstatus,
        "doc": doc.as_dict(),
    }


@frappe.whitelist()
def submit_stock_entry(stock_entry_name):
    """
    Submit a Draft Stock Entry from the backend using ERPNext/Frappe document logic.
    Then force the linked Work Order status to In Process if ERPNext did not
    refresh it automatically.
    """
    if not stock_entry_name:
        frappe.throw(_("Stock Entry name is required"))

    doc = frappe.get_doc("Stock Entry", stock_entry_name)

    if doc.docstatus == 1:
        work_order_status = None
        if doc.work_order:
            work_order_status = _force_work_order_in_progress(doc.work_order)

        return {
            "success": True,
            "name": doc.name,
            "docstatus": doc.docstatus,
            "work_order": doc.work_order,
            "work_order_status": work_order_status,
            "message": "Stock Entry already submitted. Work Order status checked.",
        }

    if doc.docstatus != 0:
        frappe.throw(_("Only Draft Stock Entry can be submitted"))

    doc.submit()
    frappe.db.commit()

    work_order_status = None
    if doc.work_order:
        work_order_status = _force_work_order_in_progress(doc.work_order)

    return {
        "success": True,
        "name": doc.name,
        "docstatus": doc.docstatus,
        "work_order": doc.work_order,
        "work_order_status": work_order_status,
    }
