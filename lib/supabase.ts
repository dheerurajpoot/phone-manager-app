import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";

const expoConfig =
	(Constants as any).expoConfig || (Constants as any).manifest || {};
const extra = expoConfig.extra || {};

export const supabase = createClient(extra.supabaseUrl, extra.supabaseAnonKey, {
	auth: {
		persistSession: false,
		autoRefreshToken: false,
	},
});
