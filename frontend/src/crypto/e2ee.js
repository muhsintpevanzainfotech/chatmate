/**
 * Native Web Crypto API End-to-End Encryption (E2EE) Module
 * Algorithm: ECDH (P-256) for Key Agreement + AES-GCM-256 for Symmetric Payload Encryption
 */

// Helper to convert ArrayBuffer to Base64 string
const bufferToBase64 = (buf) => {
  return btoa(String.fromCharCode.apply(null, new Uint8Array(buf)));
};

// Helper to convert Base64 string to ArrayBuffer
const base64ToBuffer = (base64) => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
};

/**
 * Generate an ECDH (P-256) keypair for the local user session
 */
export const generateKeyPair = async () => {
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true,
    ['deriveKey', 'deriveBits']
  );
  return keyPair;
};

/**
 * Export public key to portable JSON string (JWK format)
 */
export const exportPublicKey = async (publicKey) => {
  const exported = await window.crypto.subtle.exportKey('jwk', publicKey);
  return JSON.stringify(exported);
};

/**
 * Export private key to JWK string for local storage
 */
export const exportPrivateKey = async (privateKey) => {
  const exported = await window.crypto.subtle.exportKey('jwk', privateKey);
  return JSON.stringify(exported);
};

/**
 * Import public key from JWK JSON string
 */
export const importPublicKey = async (jwkString) => {
  if (!jwkString) return null;
  const jwk = typeof jwkString === 'string' ? JSON.parse(jwkString) : jwkString;
  return await window.crypto.subtle.importKey(
    'jwk',
    jwk,
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true,
    []
  );
};

/**
 * Import private key from JWK JSON string
 */
export const importPrivateKey = async (jwkString) => {
  if (!jwkString) return null;
  const jwk = typeof jwkString === 'string' ? JSON.parse(jwkString) : jwkString;
  return await window.crypto.subtle.importKey(
    'jwk',
    jwk,
    {
      name: 'ECDH',
      namedCurve: 'P-256',
    },
    true,
    ['deriveKey', 'deriveBits']
  );
};

/**
 * Derive an AES-GCM-256 shared encryption key from local private key + recipient public key
 */
export const deriveSharedKey = async (myPrivateKey, recipientPublicKey) => {
  return await window.crypto.subtle.deriveKey(
    {
      name: 'ECDH',
      public: recipientPublicKey,
    },
    myPrivateKey,
    {
      name: 'AES-GCM',
      length: 256,
    },
    false,
    ['encrypt', 'decrypt']
  );
};

/**
 * Encrypt plaintext string using derived AES-GCM shared key
 * Returns base64 encoded ciphertext and 12-byte IV
 */
export const encryptMessage = async (plaintext, sharedKey) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv,
    },
    sharedKey,
    data
  );

  return {
    ciphertext: bufferToBase64(encryptedBuffer),
    iv: bufferToBase64(iv),
  };
};

/**
 * Decrypt ciphertext base64 using derived AES-GCM shared key and IV
 */
export const decryptMessage = async (ciphertextBase64, ivBase64, sharedKey) => {
  try {
    const ciphertextBuffer = base64ToBuffer(ciphertextBase64);
    const ivBuffer = base64ToBuffer(ivBase64);

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: new Uint8Array(ivBuffer),
      },
      sharedKey,
      ciphertextBuffer
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (err) {
    console.error('Decryption error:', err);
    return '[Encrypted Message — Unable to Decrypt]';
  }
};
