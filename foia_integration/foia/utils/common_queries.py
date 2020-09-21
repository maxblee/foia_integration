"""A set of common filtering queries used across this application."""

import functools
from foia.models import State


def order_states():
    """Orders the states by abbreviation, with U.S. at the top."""
    return sorted(
        [
            {"abbr": state.abbr, "name": state.info.name}
            for state in State.objects.all()
        ],
        key=functools.cmp_to_key(state_ordering),
    )


def state_ordering(a, b):
    """Ordering function, for internal use by `order_states`."""
    if a["abbr"] == "US":
        return -1
    elif b["abbr"] == "US":
        return 1
    elif a["abbr"] > b["abbr"]:
        return 1
    elif a["abbr"] < b["abbr"]:
        return -1
    return 0
