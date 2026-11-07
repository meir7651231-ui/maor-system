"""תאימות לאחור: הממשק עבר ל-`sources.py`, iCount ל-`icount.py`. כאן רק ייצוא מחדש.

מקורות החשבוניות (קריאה בלבד): חשבונית ירוקה (morning) · iCount · רווחית · EZcount · CSV.
כולם מחזירים את אותו `Invoice` (app.greeninvoice) ⇒ CollectService.ingest לא יודע מאיזה ספק
הגיעו הנתונים. ראו `app/integrations/sources.py` לחוזה.
"""
from __future__ import annotations

from .icount import ICOUNT_BASE, ICOUNT_DEBT_DOCTYPES, ICountClient, map_icount_doc
from .sources import GreenInvoiceSource, InvoiceSource

__all__ = ["ICOUNT_BASE", "ICOUNT_DEBT_DOCTYPES", "GreenInvoiceSource", "ICountClient",
           "InvoiceSource", "map_icount_doc"]
