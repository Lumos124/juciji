const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const CERT_DIR = path.join(__dirname, '..', 'certs');

function derLength(n) {
    if (n < 0x80) return Buffer.from([n]);
    const bytes = [];
    while (n > 0) {
        bytes.unshift(n & 0xff);
        n = Math.floor(n / 256);
    }
    return Buffer.from([0x80 | bytes.length, ...bytes]);
}

function tlv(tag, content) {
    return Buffer.concat([Buffer.from([tag]), derLength(content.length), content]);
}

function seq(...parts) {
    return tlv(0x30, Buffer.concat(parts));
}

function setOf(...parts) {
    return tlv(0x31, Buffer.concat(parts));
}

function integer(value) {
    let bytes;
    if (Buffer.isBuffer(value)) {
        bytes = Buffer.from(value);
    } else {
        bytes = Buffer.from(value.toString(16).padStart(2, '0'), 'hex');
    }
    while (bytes.length > 1 && bytes[0] === 0) bytes = bytes.subarray(1);
    if (bytes[0] & 0x80) bytes = Buffer.concat([Buffer.from([0]), bytes]);
    return tlv(0x02, bytes);
}

function oid(parts) {
    const body = [40 * parts[0] + parts[1]];
    for (let i = 2; i < parts.length; i++) {
        let n = parts[i];
        const chunk = [n & 0x7f];
        n = Math.floor(n / 128);
        while (n > 0) {
            chunk.unshift((n & 0x7f) | 0x80);
            n = Math.floor(n / 128);
        }
        body.push(...chunk);
    }
    return tlv(0x06, Buffer.from(body));
}

function printableString(value) {
    return tlv(0x13, Buffer.from(value, 'ascii'));
}

function ia5String(value) {
    return tlv(0x16, Buffer.from(value, 'ascii'));
}

function utcTime(date) {
    const s = date.toISOString().replace(/[-:T]/g, '').replace(/\.\d{3}/, '');
    return tlv(0x17, Buffer.from(s.slice(2), 'ascii'));
}

function bitString(content) {
    return tlv(0x03, Buffer.concat([Buffer.from([0]), content]));
}

function octetString(content) {
    return tlv(0x04, content);
}

function nullValue() {
    return tlv(0x05, Buffer.alloc(0));
}

const SHA256_RSA = oid([1, 2, 840, 113549, 1, 1, 11]);
const RSA_ENCRYPTION = oid([1, 2, 840, 113549, 1, 1, 1]);
const CN = oid([2, 5, 4, 3]);
const SAN = oid([2, 5, 29, 17]);

function name(cn) {
    const atv = seq(CN, printableString(cn));
    return seq(setOf(atv));
}

const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'pkcs1', format: 'der' },
    privateKeyEncoding: { type: 'pkcs1', format: 'pem' }
});

const serial = crypto.randomBytes(8);
serial[0] &= 0x7f;

const notBefore = utcTime(new Date('2026-08-09T00:00:00Z'));
const notAfter = utcTime(new Date('2028-08-09T00:00:00Z'));

const algorithm = seq(SHA256_RSA, nullValue());
const spki = seq(
    seq(RSA_ENCRYPTION, nullValue()),
    bitString(publicKey)
);

const generalNames = seq(
    tlv(0x82, Buffer.from('localhost', 'ascii')),
    tlv(0x87, Buffer.from([127, 0, 0, 1]))
);
const sanExtension = seq(SAN, octetString(generalNames));
const extensions = tlv(0xa3, seq(sanExtension));

const tbs = seq(
    tlv(0xa0, integer(2)),
    integer(serial),
    algorithm,
    name('localhost'),
    seq(notBefore, notAfter),
    name('localhost'),
    spki,
    extensions
);

const signer = crypto.createSign('RSA-SHA256');
signer.update(tbs);
signer.end();
const signature = signer.sign(privateKey);

const certDer = seq(tbs, algorithm, bitString(signature));

function pem(label, der) {
    const b64 = der.toString('base64').match(/.{1,64}/g).join('\n');
    return `-----BEGIN ${label}-----\n${b64}\n-----END ${label}-----\n`;
}

fs.mkdirSync(CERT_DIR, { recursive: true });
fs.writeFileSync(path.join(CERT_DIR, 'cert.pem'), pem('CERTIFICATE', certDer));
fs.writeFileSync(path.join(CERT_DIR, 'key.pem'), privateKey);

const parsed = new crypto.X509Certificate(pem('CERTIFICATE', certDer));
console.log(JSON.stringify({
    subject: parsed.subject,
    issuer: parsed.issuer,
    validFrom: parsed.validFrom,
    validTo: parsed.validTo,
    san: parsed.subjectAltName
}, null, 2));
console.log('wrote', path.join(CERT_DIR, 'cert.pem'), path.join(CERT_DIR, 'key.pem'));
