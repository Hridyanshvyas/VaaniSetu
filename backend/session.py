"""In-memory call and user state for the prototype WebSocket relay."""

from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any


@dataclass
class User:
    """A connected caller and the language they want to hear."""

    user_id: str
    native_language: str
    websocket: Any | None = None


@dataclass
class Call:
    """A two-person call identified by its participant user IDs."""

    call_id: str
    participant_ids: set[str] = field(default_factory=set)


user_store: dict[str, User] = {}
call_store: dict[str, Call] = {}


def other_participant(call: Call, sender_id: str) -> str | None:
    """Return the other participant in a two-person call, if available."""
    return next((user_id for user_id in call.participant_ids if user_id != sender_id), None)
