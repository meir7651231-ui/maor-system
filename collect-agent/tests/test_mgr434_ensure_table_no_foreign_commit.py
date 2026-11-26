"""מנהל 434 (מבקר 263ב🟠) — DDL של מודולים (dsr / business_secrets) לא מבצע COMMIT לטרנזקציה של thread אחר,
ובתוך batch של אותו thread — ה-DDL חלק מהטרנזקציה (rollback לא נשבר)."""
import threading

import pytest

from app import dsr
from app.business_secrets import BusinessSecrets
from app.secretbox import SecretBox, generate_key


def _probe_other_thread(svc, fn):
    started, done = threading.Event(), threading.Event()

    def other():
        started.wait()
        try:
            fn()
        finally:
            done.set()

    t = threading.Thread(target=other)
    t.start()
    with pytest.raises(RuntimeError):
        with svc.db.batch():
            svc.db.x("INSERT INTO audit(at,actor,action,detail) VALUES('x','x','probe434','{}')")
            started.set()
            done.wait(0.5)
            raise RuntimeError("rollback")
    t.join()
    assert not svc.db.one("SELECT 1 FROM audit WHERE action='probe434'")


def test_dsr_open_request_in_other_thread_keeps_rollback(svc):
    svc.sync()
    _probe_other_thread(svc, lambda: dsr.ensure_schema(svc.db))


def test_business_secrets_ctor_in_other_thread_keeps_rollback(svc):
    svc.sync()
    box = SecretBox.from_spec(f"k1:{generate_key()}")
    _probe_other_thread(svc, lambda: BusinessSecrets(svc.db, box))


def test_ensure_schema_inside_own_batch_does_not_commit(svc):
    svc.sync()
    with pytest.raises(RuntimeError):
        with svc.db.batch():
            svc.db.x("INSERT INTO audit(at,actor,action,detail) VALUES('x','x','probe434b','{}')")
            dsr.ensure_schema(svc.db)
            raise RuntimeError("rollback")
    assert not svc.db.one("SELECT 1 FROM audit WHERE action='probe434b'")
    dsr.ensure_schema(svc.db)
    assert svc.db.one("SELECT name FROM sqlite_master WHERE name='dsr'")
