import { secretbox, sign, box, randomBytes } from "tweetnacl";
import {
  decodeUTF8,
  encodeUTF8,
  encodeBase64,
  decodeBase64
} from "tweetnacl-util";

const newSymNonce = () => randomBytes(secretbox.nonceLength);
const newAsymNonce = () => randomBytes(box.nonceLength);
const newKey = (length) => randomBytes(length ? length : secretbox.keyLength);

export const symEncryptBuffer = function(data, keyUint8Array) {
    const nonce = newSymNonce();
    const messageUint8 = data;
    const box = secretbox(messageUint8, nonce, keyUint8Array);

    const fullMessage = new Uint8Array(nonce.length + box.length);
    fullMessage.set(nonce);
    fullMessage.set(box, nonce.length);

    const base64FullMessage = encodeBase64(fullMessage);
    return base64FullMessage;
}

export const symDecryptBuffer = function(messageWithNonce, keyUint8Array) {
    const messageWithNonceAsUint8Array = decodeBase64(messageWithNonce);
    const nonce = messageWithNonceAsUint8Array.slice(0, secretbox.nonceLength);
    const message = messageWithNonceAsUint8Array.slice(
        secretbox.nonceLength,
        messageWithNonce.length
    );

    const decrypted = secretbox.open(message, nonce, keyUint8Array);
    if (!decrypted) {
        throw new Error("Could not decrypt message");
    }

    return decrypted;
}

export const symEncrypt = function(data, keyUint8Array) {
    data = decodeUTF8(JSON.stringify(data));
    return Encryption.symEncryptBuffer(data, keyUint8Array);
}

export const symDecrypt = function(messageWithNonce, keyUint8Array) {
    let decrypted = Encryption.symDecryptBuffer(messageWithNonce, keyUint8Array);
    const base64DecryptedMessage = encodeUTF8(decrypted);
    return JSON.parse(base64DecryptedMessage);
}

export const asymEncrypt = function(data, secretOrSharedKey) {
    const nonce = newAsymNonce();
    const messageUint8 = decodeUTF8(JSON.stringify(data));
    const encrypted = box.after(messageUint8, nonce, secretOrSharedKey);

    const fullMessage = new Uint8Array(nonce.length + encrypted.length);
    fullMessage.set(nonce);
    fullMessage.set(encrypted, nonce.length);

    const base64FullMessage = encodeBase64(fullMessage);
    return base64FullMessage;
}

export const asymDecrypt = function(messageWithNonce, secretOrSharedKey) {
    const messageWithNonceAsUint8Array = decodeBase64(messageWithNonce);
    const nonce = messageWithNonceAsUint8Array.slice(0, box.nonceLength);
    const message = messageWithNonceAsUint8Array.slice(
        box.nonceLength,
        messageWithNonce.length
    );

    const decrypted = box.open.after(message, nonce, secretOrSharedKey);

    if (!decrypted) {
        throw new Error('Could not decrypt message');
    }

    const base64DecryptedMessage = encodeUTF8(decrypted);
    return JSON.parse(base64DecryptedMessage);
}

export const randomKey = function(length) {
    return newKey(length);
}

export const signData = function(data, privateKeyBytes) {
    let messageUint8 = decodeUTF8(JSON.stringify(data));
    return encodeBase64(sign.detached(messageUint8, privateKeyBytes));
}

export const verifySig = function(data, sig, publicKeyByts) {
    let messageUint8 = decodeUTF8(JSON.stringify(data));
    return sign.detached.verify(messageUint8, decodeBase64(sig), publicBytes);
}