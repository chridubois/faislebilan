from fastapi import Header, HTTPException

def get_user_token(authorization: str | None = Header(default=None)) -> str | None:
    # En prod : exiger un JWT (`Bearer ...`) et vérifier. En staging, on accepte None et on utilisera service role côté back.
    if not authorization:
        return None
    if not authorization.lower().startswith("bearer "):
        raise HTTPException(401, "Invalid Authorization header")
    return authorization.split(" ", 1)[1]
