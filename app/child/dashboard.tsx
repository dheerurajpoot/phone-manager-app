import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
	Animated,
	Easing,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { useStore } from "../../store/useStore";

import * as Battery from "expo-battery";
import * as Location from "expo-location";
import { ensureRecentMediaUploaded } from "../../lib/media";
import { supabase } from "../../lib/supabase";
import { startTelephonySync } from "../../lib/telephony";

export default function ChildDashboard() {
	const { childId, childName, publishLocation, stopMonitoring } = useStore();
	const router = useRouter();

	// Animation for the "pulse" effect
	const [pulseValue] = useState(new Animated.Value(1));

	useEffect(() => {
		// Start Location Watcher
		let subscription: Location.LocationSubscription | null = null;
		let batterySubscription: Battery.Subscription | null = null;
		let heartbeatInterval: any = null;
		let demoInterval: any = null;

		const startTracking = async () => {
			try {
				const { status } =
					await Location.requestForegroundPermissionsAsync();
				if (status === "granted") {
					subscription = await Location.watchPositionAsync(
						{
							accuracy: Location.Accuracy.High,
							timeInterval: 5000,
							distanceInterval: 10,
						},
						(location) => {
							publishLocation({
								latitude: location.coords.latitude,
								longitude: location.coords.longitude,
								address: "Updated Location", // We could use reverseGeocodeAsync here
							});
						}
					);
				}
			} catch (e) {
				console.log("Error tracking location", e);
			}
		};

		const startBattery = async () => {
			try {
				const level = await Battery.getBatteryLevelAsync();
				// heartbeat updates device last_seen and battery
				heartbeat(level ?? 0);
				batterySubscription = Battery.addBatteryLevelListener(
					({ batteryLevel }) => {
						heartbeat(batteryLevel ?? 0);
					}
				);
				heartbeatInterval = setInterval(async () => {
					const currentLevel = await Battery.getBatteryLevelAsync();
					heartbeat(currentLevel ?? 0);
				}, 10000);
			} catch (e) {}
		};

		const heartbeat = async (level: number) => {
			const { childId, childName } = useStore.getState();
			if (!childId) return;
			await supabase.from("devices").upsert({
				id: childId,
				name: childName,
				battery_level: Math.round(level * 100),
				last_seen: new Date().toISOString(),
			});
		};

		startTracking();
		startBattery();
		// No demo data publishing in production
		(async () => {
			const cid = useStore.getState().childId;
			if (cid) {
				try {
					await ensureRecentMediaUploaded(cid, 12);
					await startTelephonySync(cid);
				} catch {}
			}
		})();

		Animated.loop(
			Animated.sequence([
				Animated.timing(pulseValue, {
					toValue: 1.2,
					duration: 1000,
					useNativeDriver: true,
					easing: Easing.ease,
				}),
				Animated.timing(pulseValue, {
					toValue: 1,
					duration: 1000,
					useNativeDriver: true,
					easing: Easing.ease,
				}),
			])
		).start();

		return () => {
			if (subscription) subscription.remove();
			if (batterySubscription) batterySubscription.remove();
			if (heartbeatInterval) clearInterval(heartbeatInterval);
			if (demoInterval) clearInterval(demoInterval);
		};
	}, []);

	return (
		<View style={styles.container}>
			<View style={styles.content}>
				<View style={styles.pulseContainer}>
					<Animated.View
						style={[
							styles.pulseCircle,
							{ transform: [{ scale: pulseValue }] },
						]}
					/>
					<View style={styles.iconContainer}>
						<Ionicons name='radio' size={50} color='#fff' />
					</View>
				</View>

				<Text style={styles.statusTitle}>Monitoring Active</Text>
				<Text style={styles.statusDesc}>
					{childName}'s device is currently sharing data securely.
				</Text>

				<View style={styles.infoCard}>
					<Text style={styles.infoLabel}>Device ID</Text>
					<Text style={styles.infoValue}>{childId}</Text>
					<Text style={styles.infoNote}>
						Enter this ID on the parent's device.
					</Text>
				</View>

				<View style={styles.statsRow}>
					<View style={styles.statItem}>
						<Ionicons name='location' size={24} color='#50E3C2' />
						<Text style={styles.statText}>Location On</Text>
					</View>
					<View style={styles.statItem}>
						<Ionicons name='images' size={24} color='#50E3C2' />
						<Text style={styles.statText}>Gallery Sync</Text>
					</View>
				</View>
			</View>

			<TouchableOpacity
				style={styles.stopButton}
				onPress={async () => {
					await stopMonitoring();
					router.replace("/");
				}}>
				<Text style={styles.stopButtonText}>Stop Monitoring</Text>
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#fff",
		alignItems: "center",
		justifyContent: "center",
		padding: 20,
	},
	content: {
		alignItems: "center",
		width: "100%",
	},
	pulseContainer: {
		justifyContent: "center",
		alignItems: "center",
		marginBottom: 40,
		height: 120,
		width: 120,
	},
	pulseCircle: {
		position: "absolute",
		width: 120,
		height: 120,
		borderRadius: 60,
		backgroundColor: "rgba(80, 227, 194, 0.3)",
	},
	iconContainer: {
		width: 80,
		height: 80,
		borderRadius: 40,
		backgroundColor: "#50E3C2",
		justifyContent: "center",
		alignItems: "center",
		shadowColor: "#50E3C2",
		shadowOffset: { width: 0, height: 5 },
		shadowOpacity: 0.5,
		shadowRadius: 10,
		elevation: 10,
	},
	statusTitle: {
		fontSize: 24,
		fontWeight: "bold",
		color: "#333",
		marginBottom: 10,
	},
	statusDesc: {
		fontSize: 16,
		color: "#666",
		textAlign: "center",
		marginBottom: 40,
	},
	infoCard: {
		backgroundColor: "#F5F7FA",
		padding: 20,
		borderRadius: 16,
		width: "100%",
		alignItems: "center",
		marginBottom: 30,
	},
	infoLabel: {
		fontSize: 14,
		color: "#888",
		marginBottom: 5,
	},
	infoValue: {
		fontSize: 32,
		fontWeight: "bold",
		color: "#333",
		marginBottom: 5,
		letterSpacing: 2,
	},
	infoNote: {
		fontSize: 12,
		color: "#888",
	},
	statsRow: {
		flexDirection: "row",
		gap: 30,
	},
	statItem: {
		alignItems: "center",
		gap: 8,
	},
	statText: {
		fontSize: 14,
		color: "#555",
		fontWeight: "500",
	},
	stopButton: {
		position: "absolute",
		bottom: 40,
	},
	stopButtonText: {
		color: "#FF5252",
		fontSize: 16,
	},
});
