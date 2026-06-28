import hashlib
import hmac
import secrets

PASSWORD_SCHEME = "pbkdf2_sha256"
PASSWORD_ITERATIONS = 390000
RESET_CODE_SALT_BYTES = 16


def hash_password(password: str) -> str:
    salt = secrets.token_hex(16)
    derived = hashlib.pbkdf2_hmac(
        "sha256", password.encode("utf-8"), salt.encode("utf-8"), PASSWORD_ITERATIONS
    )
    return f"{PASSWORD_SCHEME}${PASSWORD_ITERATIONS}${salt}${derived.hex()}"


def verify_password(password: str, stored_password: str) -> bool:
    if not stored_password:
        return False

    if not stored_password.startswith(f"{PASSWORD_SCHEME}$"):
        return secrets.compare_digest(password, stored_password)

    try:
        _, iterations, salt, password_hash = stored_password.split("$", 3)
        derived = hashlib.pbkdf2_hmac(
            "sha256",
            password.encode("utf-8"),
            salt.encode("utf-8"),
            int(iterations),
        )
        return hmac.compare_digest(derived.hex(), password_hash)
    except (ValueError, TypeError):
        return False


def hash_reset_code(code: str) -> str:
    salt = secrets.token_hex(RESET_CODE_SALT_BYTES)
    digest = hashlib.sha256(f"{salt}:{code}".encode("utf-8")).hexdigest()
    return f"{salt}${digest}"


def verify_reset_code(code: str, stored_hash: str) -> bool:
    try:
        salt, digest = stored_hash.split("$", 1)
    except ValueError:
        return False

    candidate = hashlib.sha256(f"{salt}:{code}".encode("utf-8")).hexdigest()
    return hmac.compare_digest(candidate, digest)
