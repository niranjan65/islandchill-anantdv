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


def _resolve_employee(employee):
    """Resolve employee input from Employee ID or employee_name."""
    if not employee:
        frappe.throw(_("Employee / Operator is required"))

    employee = str(employee).strip()

    if frappe.db.exists("Employee", employee):
        return employee

    match = frappe.db.get_value("Employee", {"employee_name": employee}, "name")
    if match:
        return match

    matches = frappe.get_all(
        "Employee",
        filters={"employee_name": ["like", f"%{employee}%"]},
        fields=["name"],
        limit=1,
    )
    if matches:
        return matches[0].name

    frappe.throw(_("Employee {0} not found").format(employee))


def _clean_html_error(message):
    """Make ERPNext HTML validation messages readable for the React alert."""
    if not message:
        return ""
    import re
    message = str(message)
    message = re.sub(r'<a\b[^>]*>(.*?)</a>', r'\1', message, flags=re.I | re.S)
    message = re.sub(r'<strong\b[^>]*>(.*?)</strong>', r'\1', message, flags=re.I | re.S)
    message = re.sub(r'<[^>]+>', '', message)
    return ' '.join(message.split())


def _now_or(value):
    """Return value or current datetime in ERPNext-friendly string format."""
    if value:
        return str(value).replace("T", " ")
    return frappe.utils.now_datetime()


def _append_job_card_comment(doc, text):
    if not text:
        return
    doc.add_comment("Comment", _clean_html_error(text))


def _get_job_card(job_card):
    if not job_card:
        frappe.throw(_("Job Card is required"))

    if not frappe.db.exists("Job Card", job_card):
        frappe.throw(_("Job Card {0} not found").format(job_card))

    return frappe.get_doc("Job Card", job_card)


def _job_card_response(doc):
    doc.reload()
    return {
        "success": True,
        "name": doc.name,
        "status": doc.status,
        "docstatus": doc.docstatus,
        "work_order": doc.work_order,
        "is_paused": getattr(doc, "is_paused", 0),
        "time_logs": [row.as_dict() for row in (doc.time_logs or [])],
    }


def _wrap_job_card_action(action):
    try:
        return action()
    except Exception as exc:
        # Preserve ERPNext validation, but remove HTML/link tags from the message.
        frappe.throw(_clean_html_error(getattr(exc, "message", None) or str(exc)))


@frappe.whitelist()
def start_job_card(job_card, employee, remarks=None, actual_start_time=None):
    """
    Start Job Card using ERPNext native controller logic.
    This creates a new Job Card Time Log row with from_time + employee and
    lets ERPNext set status = Work In Progress.
    """
    def _action():
        doc = _get_job_card(job_card)

        if doc.docstatus == 1 or doc.status == "Completed":
            frappe.throw(_("Job Card {0} is already completed/submitted").format(doc.name))

        employee_id = _resolve_employee(employee)
        start_time = _now_or(actual_start_time)

        # Use native ERPNext flow: employee belongs to Job Card Time Log, not a normal string field.
        doc.start_timer(
            start_time=start_time,
            employees=[{"employee": employee_id}],
        )

        if remarks:
            doc.reload()
            _append_job_card_comment(doc, remarks)

        if doc.work_order:
            _force_work_order_in_progress(doc.work_order)

        frappe.db.commit()
        return _job_card_response(doc)

    return _wrap_job_card_action(_action)


@frappe.whitelist()
def pause_job_card(job_card, remarks=None, actual_end_time=None):
    """
    Pause Job Card using ERPNext native controller logic.
    This closes the open Job Card Time Log row, calculates time_in_mins,
    sets is_paused = 1 and status = On Hold.
    """
    def _action():
        doc = _get_job_card(job_card)

        if doc.docstatus == 1 or doc.status == "Completed":
            frappe.throw(_("Completed Job Card {0} cannot be paused").format(doc.name))

        end_time = _now_or(actual_end_time)
        doc.pause_job(end_time=end_time)

        if remarks:
            doc.reload()
            _append_job_card_comment(doc, remarks)

        frappe.db.commit()
        return _job_card_response(doc)

    return _wrap_job_card_action(_action)


@frappe.whitelist()
def resume_job_card(job_card, remarks=None, actual_start_time=None):
    """
    Resume Job Card using ERPNext native controller logic.
    This sets is_paused = 0 and appends a new Job Card Time Log row
    using the existing employees from the Job Card.
    """
    def _action():
        doc = _get_job_card(job_card)

        if doc.docstatus == 1 or doc.status == "Completed":
            frappe.throw(_("Completed Job Card {0} cannot be resumed").format(doc.name))

        start_time = _now_or(actual_start_time)
        doc.resume_job(start_time=start_time)

        if remarks:
            doc.reload()
            _append_job_card_comment(doc, remarks)

        if doc.work_order:
            _force_work_order_in_progress(doc.work_order)

        frappe.db.commit()
        return _job_card_response(doc)

    return _wrap_job_card_action(_action)


@frappe.whitelist()
def submit_job_card(
    job_card,
    remarks=None,
    actual_end_time=None,
    qty=None,
    for_quantity=None,
    loose_qty=0,
    process_loss_qty=0,
):
    """
    Complete and submit Job Card using ERPNext native controller logic.
    This closes the open time log, fills completed_qty, calculates time,
    submits the Job Card, and respects ERPNext operation sequence validation.
    """
    def _action():
        doc = _get_job_card(job_card)

        if doc.docstatus == 1:
            return _job_card_response(doc)

        end_time = _now_or(actual_end_time)
        target_for_quantity = frappe.utils.flt(for_quantity or doc.for_quantity or 0)
        completed_qty = frappe.utils.flt(qty if qty is not None else target_for_quantity)

        if completed_qty <= 0:
            frappe.throw(_("Completed Quantity must be greater than 0"))

        doc.complete_job_card(
            qty=completed_qty,
            for_quantity=target_for_quantity,
            end_time=end_time,
            loose_qty=frappe.utils.flt(loose_qty or 0),
            process_loss_qty=frappe.utils.flt(process_loss_qty or 0),
            auto_submit=1,
        )

        if remarks:
            doc.reload()
            _append_job_card_comment(doc, remarks)

        if doc.work_order:
            status = frappe.db.get_value("Work Order", doc.work_order, "status")
            if status not in WORK_ORDER_FINAL_STATUSES:
                _force_work_order_in_progress(doc.work_order)

        frappe.db.commit()
        return _job_card_response(doc)

    return _wrap_job_card_action(_action)


@frappe.whitelist()
def add_job_card_comment(job_card, content, operator=None):
    """Add a plain ERPNext Comment to the Job Card without changing time logs/status."""
    def _action():
        doc = _get_job_card(job_card)
        clean_content = _clean_html_error(content)
        if not clean_content:
            frappe.throw(_("Comment is required"))

        prefix = ""
        if operator:
            prefix = _("Operator: {0}\n").format(_clean_html_error(operator))

        comment = doc.add_comment("Comment", prefix + clean_content)
        frappe.db.commit()

        return {
            "success": True,
            "name": getattr(comment, "name", None),
            "job_card": doc.name,
            "content": clean_content,
        }

    return _wrap_job_card_action(_action)


@frappe.whitelist()
def get_job_card_comments(job_card):
    """Return previous ERPNext comments for a Job Card for the React remarks modal."""
    doc = _get_job_card(job_card)
    comments = frappe.get_all(
        "Comment",
        filters={
            "reference_doctype": "Job Card",
            "reference_name": doc.name,
            "comment_type": "Comment",
        },
        fields=["name", "content", "owner", "creation"],
        order_by="creation asc",
        limit_page_length=100,
    )

    return {
        "success": True,
        "job_card": doc.name,
        "comments": comments,
    }


@frappe.whitelist()
def get_job_card_completion_defaults(job_card):
    """Return default values for the Job Card completion modal."""
    doc = _get_job_card(job_card)
    for_quantity = frappe.utils.flt(doc.for_quantity or 0)
    total_completed_qty = frappe.utils.flt(doc.total_completed_qty or 0)
    completed_default = total_completed_qty if total_completed_qty > 0 else for_quantity
    process_loss_default = max(0, for_quantity - completed_default)

    return {
        "success": True,
        "job_card": doc.name,
        "work_order": doc.work_order,
        "for_quantity": for_quantity,
        "total_completed_qty": total_completed_qty,
        "completed_qty_default": completed_default,
        "process_loss_qty_default": process_loss_default,
        "status": doc.status,
        "docstatus": doc.docstatus,
    }


def _get_last_submitted_job_card_details(work_order):
    """Use the last operation's submitted Job Card as the default Work Order finish quantity."""
    operations = frappe.get_all(
        "Work Order Operation",
        filters={"parent": work_order},
        fields=["name", "operation", "idx"],
        order_by="idx desc",
        limit=1,
    )

    filters = {"work_order": work_order, "docstatus": 1}
    if operations:
        filters["operation_id"] = operations[0].name

    cards = frappe.get_all(
        "Job Card",
        filters=filters,
        fields=["name", "for_quantity", "total_completed_qty", "process_loss_qty"],
        order_by="modified desc",
        limit=1,
    )

    if not cards:
        return frappe._dict({})

    return frappe._dict(cards[0])


@frappe.whitelist()
def finish_work_order(work_order, qty=None, process_loss_qty=None, submit=1):
    """
    Create the ERPNext Manufacture Stock Entry after all Job Cards are completed.
    This mirrors the Work Order Finish button, but is callable from the React app.
    """
    def _action():
        if not work_order:
            frappe.throw(_("Work Order is required"))

        wo = frappe.get_doc("Work Order", work_order)
        wo.check_permission("write")

        running_cards = frappe.get_all(
            "Job Card",
            filters={
                "work_order": work_order,
                "docstatus": 0,
                "status": ["in", ["Open", "Work In Progress", "On Hold", "Material Transferred"]],
            },
            pluck="name",
        )
        if running_cards:
            frappe.throw(_("Complete all Job Cards before finishing Work Order. Pending: {0}").format(", ".join(running_cards)))

        last_jc = _get_last_submitted_job_card_details(work_order)
        qty_to_manufacture = frappe.utils.flt(qty) if qty not in (None, "", "null") else frappe.utils.flt(last_jc.get("total_completed_qty") or wo.qty - wo.produced_qty)
        process_loss = frappe.utils.flt(process_loss_qty) if process_loss_qty not in (None, "", "null") else frappe.utils.flt(last_jc.get("process_loss_qty") or 0)

        if qty_to_manufacture <= 0 and process_loss <= 0:
            frappe.throw(_("Manufacture quantity must be greater than 0"))

        from erpnext.manufacturing.doctype.work_order.work_order import make_stock_entry

        try:
            stock_entry_dict = make_stock_entry(
                work_order_id=work_order,
                purpose="Manufacture",
                qty=qty_to_manufacture,
                process_loss_qty=process_loss,
            )
        except TypeError:
            # Compatibility fallback if site has the original ERPNext method without process_loss_qty.
            stock_entry_dict = make_stock_entry(
                work_order_id=work_order,
                purpose="Manufacture",
                qty=qty_to_manufacture,
            )

        stock_entry = frappe.get_doc(stock_entry_dict)
        if process_loss and stock_entry.meta.has_field("process_loss_qty"):
            stock_entry.process_loss_qty = process_loss

        stock_entry.insert(ignore_permissions=False)

        if frappe.utils.cint(submit):
            stock_entry.submit()

        wo.reload()
        wo.update_status()
        frappe.db.commit()

        return {
            "success": True,
            "work_order": work_order,
            "stock_entry": stock_entry.name,
            "stock_entry_docstatus": stock_entry.docstatus,
            "status": wo.status,
            "produced_qty": wo.produced_qty,
            "process_loss_qty": wo.process_loss_qty,
        }

    return _wrap_job_card_action(_action)


@frappe.whitelist()
def change_work_order_status(work_order, status):
    """Expose ERPNext Work Order Close / Stop / Re-open to the React app."""
    def _action():
        if not work_order:
            frappe.throw(_("Work Order is required"))

        if status not in {"Closed", "Stopped", "Resumed"}:
            frappe.throw(_("Invalid Work Order status action {0}").format(status))

        if status == "Closed":
            from erpnext.manufacturing.doctype.work_order.work_order import close_work_order
            new_status = close_work_order(work_order, "Closed")
        else:
            from erpnext.manufacturing.doctype.work_order.work_order import stop_unstop
            new_status = stop_unstop(work_order, status)

        frappe.db.commit()
        return {
            "success": True,
            "work_order": work_order,
            "status": new_status,
        }

    return _wrap_job_card_action(_action)
