import base64
from pathlib import Path

from Cryptodome.Cipher import PKCS1_v1_5 as Cipher_pkcs1_v1_5
from Cryptodome.PublicKey import RSA


def decrypt(line: str) -> str:
    file_path = Path(__file__).resolve().parents[2] / "conf" / "private.pem"
    rsa_key = RSA.importKey(file_path.read_text(), "Welcome")
    cipher = Cipher_pkcs1_v1_5.new(rsa_key)
    return cipher.decrypt(base64.b64decode(line), "Fail to decrypt password!").decode("utf-8")
