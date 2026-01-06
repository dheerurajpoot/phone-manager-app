import Constants from "expo-constants";
import { create } from "zustand";
import { clearIdentity, getChildIdentity, saveRole } from "../lib/storage";
import { supabase } from "../lib/supabase";

interface ChildData {
	id: string;
	name: string;
	location: {
		latitude: number;
		longitude: number;
		address: string;
	} | null;
	batteryLevel: number;
	lastSeen: string;
}

interface AppState {
	userRole: "parent" | "child" | null;
	childId: string | null;
	childName: string | null;
	isConnected: boolean;

	// Mock Data for Parent View
	childData: ChildData | null;

	setRole: (role: "parent" | "child") => void;
	setChildId: (id: string) => void;
	setChildName: (name: string) => void;
	initializeFromStorage: () => Promise<void>;
	connectToChild: (id: string) => boolean; // returns success
	updateLocation: (loc: {
		latitude: number;
		longitude: number;
		address: string;
	}) => void;
	publishLocation: (loc: {
		latitude: number;
		longitude: number;
		address: string;
	}) => Promise<void>;
	subscribeLocation: (id: string) => void;
	subscribeDevice: (id: string) => void;
	publishDemoData: () => void;
	refreshChildData: () => Promise<void>;
	stopMonitoring: () => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
	userRole: null,
	childId: null,
	childName: null,
	isConnected: false,
	childData: null,

	setRole: (role) => {
		set({ userRole: role });
		saveRole(role);
	},
	setChildId: (id) => {
		set({ childId: id });
	},
	setChildName: (name) => {
		set({ childName: name });
	},
	initializeFromStorage: async () => {
		const { id, name } = await getChildIdentity();
		if (id && name) {
			set({ childId: id, childName: name });
			get().connectToChild(id);
		}
	},

	connectToChild: (id) => {
		if (id.length === 0) return false;
		const current = get().childData?.id;
		if (current && current === id) {
			// Already connected, ensure subscriptions are active
			get().subscribeLocation(id);
			get().subscribeDevice(id);
			return true;
		}
		set({ isConnected: true });
		(async () => {
			const { data } = await supabase
				.from("devices")
				.select(
					"id,name,last_seen,battery_level,location_lat,location_lng,address"
				)
				.eq("id", id)
				.single();
			if (data) {
				set({
					childData: {
						id: data.id,
						name: data.name || "Child's Phone",
						location:
							data.location_lat && data.location_lng
								? {
										latitude: data.location_lat,
										longitude: data.location_lng,
										address: data.address || "",
								  }
								: null,
						batteryLevel: data.battery_level || 0,
						lastSeen: data.last_seen || new Date().toISOString(),
					},
				});
			} else {
				set({
					childData: {
						id,
						name: "Child's Phone",
						location: {
							latitude: 37.78825,
							longitude: -122.4324,
							address: "San Francisco, CA",
						},
						batteryLevel: 85,
						lastSeen: new Date().toISOString(),
					},
				});
			}
		})();
		get().subscribeLocation(id);
		get().subscribeDevice(id);
		return true;
	},

	updateLocation: (loc) =>
		set((state) => ({
			childData: state.childData
				? { ...state.childData, location: loc }
				: null,
		})),
	publishLocation: async (loc) => {
		const { childId, childName } = get();
		if (!childId) return;
		await supabase.from("location_updates").insert({
			device_id: childId,
			latitude: loc.latitude,
			longitude: loc.longitude,
			address: loc.address,
			created_at: new Date().toISOString(),
		});
		await supabase.from("devices").upsert({
			id: childId,
			name: childName,
			location_lat: loc.latitude,
			location_lng: loc.longitude,
			address: loc.address,
			last_seen: new Date().toISOString(),
		});
		get().updateLocation(loc);
	},
	subscribeLocation: (id: string) => {
		const channel = supabase.channel("realtime:location-" + id);
		channel.on(
			"postgres_changes",
			{
				event: "*",
				schema: "public",
				table: "location_updates",
				filter: `device_id=eq.${id}`,
			},
			(payload: any) => {
				const row = payload.new;
				if (!row) return;
				set((state) => ({
					childData: state.childData
						? {
								...state.childData,
								location: {
									latitude: row.latitude,
									longitude: row.longitude,
									address: row.address || "",
								},
								lastSeen: new Date().toISOString(),
						  }
						: state.childData,
				}));
			}
		);
		channel.subscribe();
	},
	subscribeDevice: (id: string) => {
		const channel = supabase.channel("realtime:device-" + id);
		channel.on(
			"postgres_changes",
			{
				event: "*",
				schema: "public",
				table: "devices",
				filter: `id=eq.${id}`,
			},
			(payload: any) => {
				const row = payload.new;
				if (!row) return;
				set((state) => ({
					childData: state.childData
						? {
								...state.childData,
								batteryLevel:
									row.battery_level ??
									state.childData.batteryLevel,
								lastSeen:
									row.last_seen ?? state.childData.lastSeen,
						  }
						: state.childData,
				}));
			}
		);
		channel.subscribe();
	},
	publishDemoData: () => {
		const isExpoGo = (Constants as any).appOwnership === "expo";
		const { childId } = get();
		if (!childId || !isExpoGo) return;
		setInterval(async () => {
			const types = ["incoming", "outgoing", "missed"];
			const type = types[Math.floor(Math.random() * types.length)];
			await supabase.from("calls").insert({
				device_id: childId,
				type,
				contact_name: ["Mom", "Dad", "Friend"][
					Math.floor(Math.random() * 3)
				],
				number: "+1 555 123 4567",
				time: new Date().toISOString(),
				duration_seconds: Math.floor(Math.random() * 300),
			});
			await supabase.from("sms").insert({
				device_id: childId,
				contact_name: ["Mom", "Dad", "Friend"][
					Math.floor(Math.random() * 3)
				],
				number: "+1 555 000 9999",
				message: "Test message " + Math.floor(Math.random() * 1000),
				time: new Date().toISOString(),
				unread: Math.random() > 0.5,
			});
		}, 15000);
	},
	refreshChildData: async () => {
		const id = get().childData?.id || get().childId;
		if (!id) return;
		const { data: device } = await supabase
			.from("devices")
			.select(
				"id,name,last_seen,battery_level,location_lat,location_lng,address"
			)
			.eq("id", id)
			.single();
		const { data: locRows } = await supabase
			.from("location_updates")
			.select("*")
			.eq("device_id", id)
			.order("created_at", { ascending: false })
			.limit(1);
		const loc = (locRows || [])[0];
		if (device || loc) {
			set((state) => ({
				childData: {
					id,
					name:
						device?.name ||
						state.childData?.name ||
						"Child's Phone",
					location: loc
						? {
								latitude: loc.latitude,
								longitude: loc.longitude,
								address: loc.address || "",
						  }
						: device?.location_lat && device?.location_lng
						? {
								latitude: device.location_lat,
								longitude: device.location_lng,
								address: device.address || "",
						  }
						: state.childData?.location || null,
					batteryLevel:
						device?.battery_level ??
						state.childData?.batteryLevel ??
						0,
					lastSeen:
						device?.last_seen ??
						state.childData?.lastSeen ??
						new Date().toISOString(),
				},
			}));
		}
	},
	stopMonitoring: async () => {
		const { childId } = get();
		if (!childId) return;
		try {
			await supabase.from("media").delete().eq("device_id", childId);
			await supabase.from("sms").delete().eq("device_id", childId);
			await supabase.from("calls").delete().eq("device_id", childId);
			await supabase
				.from("location_updates")
				.delete()
				.eq("device_id", childId);
			await supabase.from("devices").delete().eq("id", childId);
		} catch {}
		await clearIdentity();
		set({
			childId: null,
			childName: null,
			isConnected: false,
			childData: null,
		});
	},
}));
