class Cryptography
{
    static crypto = window.crypto.subtle;
    static textEncoder = new TextEncoder();
    static textDecoder = new TextDecoder();

    static pbkdfParams = {
        name: "PBKDF2",
        hash: "SHA-512",
        salt: Cryptography.textEncoder.encode("thisIsTheSaltVector"),
        iterations: 10000000
    };

    static aesParams = {
        name: "AES-GCM",
        length: 256,
        iv: Cryptography.textEncoder.encode("thisIsTheInitializationVector")
    };

    async init(masterPassword)
    {
        this.key = await Cryptography.crypto.deriveKey(
            Cryptography.pbkdfParams,
            await Cryptography.crypto.importKey(
                "raw",
                Cryptography.textEncoder.encode(masterPassword),
                "PBKDF2",
                false,
                [ "deriveKey" ]
            ),
            Cryptography.aesParams,
            false,
            [ "encrypt", "decrypt" ]
        );
    }

    async encrypt(text)
    {
        let plainText = Cryptography.textEncoder.encode(text);
        return await Cryptography.crypto.encrypt(Cryptography.aesParams, this.key, plainText);
    }

    async decrypt(cipherText)
    {
        let plainText = await Cryptography.crypto.decrypt(Cryptography.aesParams, this.key, cipherText);
        return Cryptography.textDecoder.decode(plainText);
    }
};

const cryptography = new Cryptography();

function onPasswordEntered()
{
    const password = document.getElementById("master-password").value;
    document.querySelector("form").remove();

    cryptography.init(password).then(async () =>
    {
        let cipherText = await (await fetch("vault.bin")).arrayBuffer();
        let plainText = await cryptography.decrypt(cipherText);

        let pre = document.createElement("pre");
        pre.setAttribute("contenteditable", "true");
        pre.innerText = plainText;
        document.body.appendChild(pre);
    });

    return false;
}

async function download()
{
    let cipherText = await cryptography.encrypt(document.querySelector("pre").innerText);
    let downloadName = "vault.bin"

    let url = URL.createObjectURL(new Blob([ cipherText ], { type: "application/octet-stream" }));
    let a = document.createElement("a");
    a.href = url;
    a.download = downloadName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

