export function toId (str: string): string {
	return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

export function uploadToPastie (text: string): Promise<string> {
	return axios.post(`https://pastie.io/documents`, text).then(res => `https://pastie.io/raw/${res.data.key as string}`);
}
