import pytest
from pydantic import ValidationError

from backend.main import SessionRegistration
from backend.session import Call, User, other_participant


def test_other_participant_returns_the_receiver():
    call = Call("call-1", {"sender", "receiver"})

    assert other_participant(call, "sender") == "receiver"


def test_other_participant_returns_none_when_call_has_no_receiver():
    call = Call("call-1", {"sender"})

    assert other_participant(call, "sender") is None


def test_session_registration_normalises_and_restricts_pipeline_languages():
    assert SessionRegistration(user_id="user", call_id="call", native_language="ta-IN").native_language == "ta"

    with pytest.raises(ValidationError, match="Unsupported language"):
        SessionRegistration(user_id="user", call_id="call", native_language="bn")
