import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useStore } from "../../store/useStore";

export default function LocationScreen() {
	const { childData } = useStore();
	const router = useRouter();

	const address = childData?.location?.address || "Location unavailable";
	const latitude = childData?.location?.latitude;
	const longitude = childData?.location?.longitude;

	return (
		<View style={styles.container}>
			<View style={styles.center}>
				<Ionicons name='map-outline' size={64} color='#ccc' />
				<Text style={styles.message}>
					Interactive Map is not available on Web.
				</Text>
				<Text style={styles.subMessage}>
					Please use the mobile app to view the live map.
				</Text>

				{latitude && longitude && (
					<View style={styles.coordsBox}>
						<Text style={styles.coordLabel}>
							Last Known Coordinates:
						</Text>
						<Text style={styles.coordValue}>
							{latitude.toFixed(6)}, {longitude.toFixed(6)}
						</Text>
						<Text style={styles.address}>{address}</Text>
					</View>
				)}
			</View>

			<TouchableOpacity
				style={styles.backButton}
				onPress={() => router.back()}>
				<Ionicons name='arrow-back' size={24} color='#333' />
			</TouchableOpacity>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F5F7FA",
	},
	center: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 20,
	},
	message: {
		fontSize: 18,
		fontWeight: "bold",
		color: "#333",
		marginTop: 20,
		textAlign: "center",
	},
	subMessage: {
		fontSize: 14,
		color: "#666",
		marginTop: 10,
		textAlign: "center",
	},
	coordsBox: {
		marginTop: 30,
		padding: 20,
		backgroundColor: "#fff",
		borderRadius: 12,
		alignItems: "center",
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.1,
		shadowRadius: 4,
		elevation: 3,
	},
	coordLabel: {
		fontSize: 12,
		color: "#888",
		marginBottom: 5,
	},
	coordValue: {
		fontSize: 18,
		fontWeight: "bold",
		color: "#333",
		marginBottom: 5,
	},
	address: {
		fontSize: 14,
		color: "#666",
		textAlign: "center",
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
});
