import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import * as Location from "expo-location";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
	ActivityIndicator,
	Alert,
	Platform,
	StyleSheet,
	Text,
	TextInput,
	TouchableOpacity,
	View,
} from "react-native";
import { ensureRecentMediaUploaded } from "../../lib/media";
import { saveChildIdentity } from "../../lib/storage";
import { useStore } from "../../store/useStore";

let MediaLibrary: any;
if (Platform.OS !== "web") {
	try {
		MediaLibrary = require("expo-media-library");
	} catch (e) {
		console.error("MediaLibrary not available", e);
	}
}

export default function ChildSetupScreen() {
	const router = useRouter();
	const setChildId = useStore((state) => state.setChildId);
	const setChildName = useStore((state) => state.setChildName);
	const { initializeFromStorage } = useStore();

	const [name, setName] = useState("");
	const [deviceId, setDeviceId] = useState("");
	const [loading, setLoading] = useState(false);
	const [permissionsGranted, setPermissionsGranted] = useState(false);

	useEffect(() => {
		// Generate a random ID for convenience
		const randomId = Math.floor(100000 + Math.random() * 900000).toString();
		setDeviceId(randomId);
		initializeFromStorage().then(() => {
			const cid = useStore.getState().childId;
			if (cid) {
				router.replace("/child/dashboard");
			}
		});
	}, []);

	const requestPermissions = async () => {
		setLoading(true);
		try {
			const { status: locationStatus } =
				await Location.requestForegroundPermissionsAsync();

			let mediaStatus = "granted";
			const isExpoGo = Constants.appOwnership === "expo";
			if (Platform.OS === "android" && isExpoGo) {
				Alert.alert(
					"Limited in Expo Go",
					"Full media library access is not available in Expo Go on Android. Create a development build to test this feature."
				);
				mediaStatus = "granted";
			} else if (MediaLibrary) {
				const res = await MediaLibrary.requestPermissionsAsync();
				mediaStatus = res.status;
			}

			if (locationStatus === "granted" && mediaStatus === "granted") {
				setPermissionsGranted(true);
				Alert.alert("Success", "All permissions granted!");
				// publish initial location and media
				try {
					const pos = await Location.getCurrentPositionAsync({
						accuracy: Location.Accuracy.Balanced,
					});
					useStore.getState().publishLocation({
						latitude: pos.coords.latitude,
						longitude: pos.coords.longitude,
						address: "Initial Location",
					});
				} catch {}
			} else {
				Alert.alert(
					"Error",
					"Permissions are required for the app to function."
				);
			}
		} catch (error) {
			console.error(error);
			Alert.alert("Error", "Failed to request permissions.");
		} finally {
			setLoading(false);
		}
	};

	const handleStart = () => {
		if (!name.trim()) {
			Alert.alert("Required", "Please enter a name for this device.");
			return;
		}
		if (!permissionsGranted) {
			Alert.alert("Required", "Please grant permissions first.");
			return;
		}

		setChildId(deviceId);
		setChildName(name);
		saveChildIdentity(deviceId, name);
		ensureRecentMediaUploaded(deviceId, 12).catch(() => {});

		// Navigate to Child Dashboard
		router.replace("/child/dashboard");
	};

	return (
		<View style={styles.container}>
			<View style={styles.card}>
				<View style={styles.iconHeader}>
					<Ionicons
						name='phone-portrait-outline'
						size={50}
						color='#50E3C2'
					/>
				</View>
				<Text style={styles.title}>Device Setup</Text>
				<Text style={styles.subtitle}>
					This device will be monitored. Please set up the details
					below.
				</Text>

				<View style={styles.inputContainer}>
					<Text style={styles.label}>
						Device Name (e.g., John's Phone)
					</Text>
					<TextInput
						style={styles.input}
						placeholder='Enter name'
						value={name}
						onChangeText={setName}
					/>
				</View>

				<View style={styles.inputContainer}>
					<Text style={styles.label}>
						Device ID (Share this with parent)
					</Text>
					<View style={styles.idDisplay}>
						<Text style={styles.idText}>{deviceId}</Text>
					</View>
				</View>

				<TouchableOpacity
					style={[
						styles.button,
						styles.permButton,
						permissionsGranted && styles.permButtonActive,
					]}
					onPress={requestPermissions}
					disabled={permissionsGranted}>
					{loading ? (
						<ActivityIndicator color='#fff' />
					) : (
						<>
							<Ionicons
								name={
									permissionsGranted
										? "checkmark-circle"
										: "shield-checkmark"
								}
								size={20}
								color='#fff'
							/>
							<Text style={styles.buttonText}>
								{permissionsGranted
									? "Permissions Granted"
									: "Grant Permissions"}
							</Text>
						</>
					)}
				</TouchableOpacity>

				<TouchableOpacity
					style={[
						styles.button,
						styles.startButton,
						!permissionsGranted && styles.disabledButton,
					]}
					onPress={handleStart}
					disabled={!permissionsGranted}>
					<Text style={styles.buttonText}>Start Monitoring</Text>
					<Ionicons name='arrow-forward' size={20} color='#fff' />
				</TouchableOpacity>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#50E3C2",
		padding: 20,
		justifyContent: "center",
	},
	card: {
		backgroundColor: "#fff",
		borderRadius: 20,
		padding: 24,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 10 },
		shadowOpacity: 0.1,
		shadowRadius: 20,
		elevation: 10,
	},
	iconHeader: {
		alignSelf: "center",
		marginBottom: 20,
		width: 80,
		height: 80,
		borderRadius: 40,
		backgroundColor: "#E0F9F4",
		justifyContent: "center",
		alignItems: "center",
	},
	title: {
		fontSize: 24,
		fontWeight: "bold",
		color: "#333",
		textAlign: "center",
		marginBottom: 10,
	},
	subtitle: {
		fontSize: 14,
		color: "#666",
		textAlign: "center",
		marginBottom: 30,
	},
	inputContainer: {
		marginBottom: 20,
	},
	label: {
		fontSize: 14,
		fontWeight: "600",
		color: "#333",
		marginBottom: 8,
	},
	input: {
		backgroundColor: "#F5F7FA",
		borderRadius: 12,
		padding: 16,
		fontSize: 16,
		color: "#333",
		borderWidth: 1,
		borderColor: "#E1E1E1",
	},
	idDisplay: {
		backgroundColor: "#F0F0F0",
		borderRadius: 12,
		padding: 16,
		alignItems: "center",
		borderWidth: 2,
		borderColor: "#ddd",
		borderStyle: "dashed",
	},
	idText: {
		fontSize: 24,
		fontWeight: "bold",
		color: "#333",
		letterSpacing: 2,
	},
	button: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "center",
		padding: 16,
		borderRadius: 12,
		marginBottom: 12,
		gap: 10,
	},
	permButton: {
		backgroundColor: "#FF9F43",
	},
	permButtonActive: {
		backgroundColor: "#28C76F",
	},
	startButton: {
		backgroundColor: "#333",
		marginTop: 10,
	},
	disabledButton: {
		backgroundColor: "#ccc",
	},
	buttonText: {
		color: "#fff",
		fontWeight: "bold",
		fontSize: 16,
	},
});
