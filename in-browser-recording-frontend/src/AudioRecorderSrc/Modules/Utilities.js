export const blobToFile = (blob, fileName) => {
	blob.lastModifiedDate = new Date();
	blob.name = fileName;
	return blob
}