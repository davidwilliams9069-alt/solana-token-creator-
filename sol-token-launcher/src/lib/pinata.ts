const JWT = import.meta.env.VITE_PINATA_JWT as string;
const GATEWAY = "https://gateway.pinata.cloud/ipfs/";

if (!JWT) {
  console.warn("VITE_PINATA_JWT is not set. Pinata uploads will fail.");
}

export async function uploadImageToIPFS(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append(
    "pinataMetadata",
    JSON.stringify({ name: `token-image-${Date.now()}` })
  );
  formData.append("pinataOptions", JSON.stringify({ cidVersion: 1 }));

  const res = await fetch("https://api.pinata.cloud/pinning/pinFileToIPFS", {
    method: "POST",
    headers: { Authorization: `Bearer ${JWT}` },
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pinata image upload failed: ${text}`);
  }

  const data = (await res.json()) as { IpfsHash: string };
  return `${GATEWAY}${data.IpfsHash}`;
}

export async function uploadMetadataToIPFS(metadata: object): Promise<string> {
  const res = await fetch("https://api.pinata.cloud/pinning/pinJSONToIPFS", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${JWT}`,
    },
    body: JSON.stringify({
      pinataContent: metadata,
      pinataMetadata: { name: `token-metadata-${Date.now()}` },
      pinataOptions: { cidVersion: 1 },
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Pinata metadata upload failed: ${text}`);
  }

  const data = (await res.json()) as { IpfsHash: string };
  return `${GATEWAY}${data.IpfsHash}`;
}
