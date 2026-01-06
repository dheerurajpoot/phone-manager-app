import Constants from "expo-constants";
import * as FileSystem from "expo-file-system";
import * as MediaLibrary from "expo-media-library";
import { supabase } from "./supabase";

export async function listRecentAssets(limit = 12) {
	const perms = await MediaLibrary.getPermissionsAsync();
	if (perms.status !== "granted") {
		throw new Error("Media permission not granted");
	}
	const assets = await MediaLibrary.getAssetsAsync({
		mediaType: ["photo", "video"],
		sortBy: MediaLibrary.SortBy.creationTime,
		first: limit,
	});
	return assets.assets;
}

export async function uploadAssetToStorage(
	deviceId: string,
	asset: MediaLibrary.Asset
) {
	const uri = asset.uri;
	const path = `child-${deviceId}/${asset.id}.${
		asset.mediaType === "video" ? "mp4" : "jpg"
	}`;
	const expoConfig =
		(Constants as any).expoConfig || (Constants as any).manifest || {};
	const extra = expoConfig.extra || {};
	const supabaseUrl: string = extra.supabaseUrl;
	const supabaseAnonKey: string = extra.supabaseAnonKey;

	const contentType =
		asset.mediaType === "video" ? "video/mp4" : "image/jpeg";
	const uploadUrl = `${supabaseUrl}/storage/v1/object/media/${encodeURIComponent(
		path
	)}`;
	const res = await FileSystem.uploadAsync(uploadUrl, uri, {
		httpMethod: "POST",
		// @ts-expect-error string literal supported at runtime
		uploadType: "multipart",
		fieldName: "file",
		headers: {
			Authorization: `Bearer ${supabaseAnonKey}`,
			"x-upsert": "true",
		},
	});
	if (res.status !== 200 && res.status !== 201) {
		throw new Error(`Upload failed: ${res.status}`);
	}
	await supabase.from("media").upsert({
		device_id: deviceId,
		file_path: path,
		mime_type: contentType,
		created_at: new Date().toISOString(),
	});
	return path;
}

export async function ensureRecentMediaUploaded(deviceId: string, limit = 12) {
	const assets = await listRecentAssets(limit);
	for (const a of assets) {
		try {
			await uploadAssetToStorage(deviceId, a);
		} catch {}
	}
}
