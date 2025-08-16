import firebase_admin
from firebase_admin import credentials, auth
from fastapi import HTTPException, Header

# Initialize Firebase Admin with service account JSON
if not firebase_admin._apps:
    cred = credentials.Certificate("firebase-service-key.json")
    firebase_admin.initialize_app(cred)


def verify_token(authorization: str = Header(None)):
    """
    Verifies Firebase ID token sent by client.
    Clients must send:
    Authorization: Bearer <idToken>
    """
    try:
        if not authorization:
            raise HTTPException(status_code=401, detail="Authorization header missing")

        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(status_code=401, detail="Invalid token scheme")

        decoded_token = auth.verify_id_token(token)

        return {
            "uid": decoded_token.get("uid"),
            "email": decoded_token.get("email"),
            "phone_number": decoded_token.get("phone_number"),
            "name": decoded_token.get("name"),
            "provider": decoded_token.get("firebase", {}).get("sign_in_provider")
        }

    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Invalid or expired token: {e}")
