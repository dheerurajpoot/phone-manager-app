import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
	Platform,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { supabase } from "../../lib/supabase";
import { useStore } from "../../store/useStore";

let MapView: any;
let Marker: any;

if (Platform.OS !== "web") {
	try {
		const Maps = require("react-native-maps");
		MapView = Maps.default;
		Marker = Maps.Marker;
	} catch (e) {
		console.error("Failed to load maps", e);
	}
}

export default function LocationScreen() {
	const { childData } = useStore();
	const [fallbackLoc, setFallbackLoc] = useState<{
		latitude: number;
		longitude: number;
		address: string;
	} | null>(null);
	useEffect(() => {
		(async () => {
			if (!childData?.id) return;
			if (!childData.location) {
				const { data } = await supabase
					.from("location_updates")
					.select("*")
					.eq("device_id", childData.id)
					.order("created_at", { ascending: false })
					.limit(1);
				const row = (data || [])[0];
				if (row) {
					setFallbackLoc({
						latitude: row.latitude,
						longitude: row.longitude,
						address: row.address || "",
					});
				}
			}
		})();
	}, [childData?.id, childData?.location]);
	const router = useRouter();

	if (Platform.OS === "web") {
		return (
			<View style={styles.center}>
				<Text>Map not supported on Web here.</Text>
				<TouchableOpacity onPress={() => router.back()}>
					<Text>Go Back</Text>
				</TouchableOpacity>
			</View>
		);
	}

	if (!childData || (!childData.location && !fallbackLoc)) {
		return (
			<View style={styles.center}>
				<Text>Location data unavailable.</Text>
				<TouchableOpacity onPress={() => router.back()}>
					<Text>Go Back</Text>
				</TouchableOpacity>
			</View>
		);
	}

	const { latitude, longitude, address } = childData.location || fallbackLoc!;

	return (
		<View style={styles.container}>
			<MapView
				style={styles.map}
				initialRegion={{
					latitude,
					longitude,
					latitudeDelta: 0.01,
					longitudeDelta: 0.01,
				}}>
				<Marker
					coordinate={{ latitude, longitude }}
					title={childData.name}
					description={address}
				/>
			</MapView>

			<TouchableOpacity
				style={styles.backButton}
				onPress={() => router.back()}>
				<Ionicons name='arrow-back' size={24} color='#333' />
			</TouchableOpacity>

			<View style={styles.infoCard}>
				<Text style={styles.addressTitle}>Current Location</Text>
				<Text style={styles.addressText}>{address}</Text>
				<Text style={styles.coordText}>
					{latitude.toFixed(6)}, {longitude.toFixed(6)}
				</Text>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
	},
	center: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
	},
	map: {
		width: "100%",
		height: "100%",
	},
	backButton: {
		position: "absolute",
		top: 50,
		left: 20,
		width: 40,
		height: 40,
		borderRadius: 20,
		backgroundColor: "#fff",
		justifyContent: "center",
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.2,
		shadowRadius: 4,
		elevation: 5,
	},
	infoCard: {
		position: "absolute",
		bottom: 30,
		left: 20,
		right: 20,
		backgroundColor: "#fff",
		padding: 20,
		borderRadius: 20,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.1,
		shadowRadius: 10,
		elevation: 10,
	},
	addressTitle: {
		fontSize: 12,
		color: "#888",
		textTransform: "uppercase",
		marginBottom: 5,
		fontWeight: "bold",
	},
	addressText: {
		fontSize: 16,
		color: "#333",
		fontWeight: "600",
		marginBottom: 5,
	},
	coordText: {
		fontSize: 12,
		color: "#666",
	},
});
