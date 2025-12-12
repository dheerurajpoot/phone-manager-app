import Constants from "expo-constants";
import * as Location from "expo-location";
import * as Notifications from "expo-notifications";
import * as TaskManager from "expo-task-manager";
import { useEffect, useState } from "react";
import { Alert, Button, Platform, StyleSheet, Text, View } from "react-native";

const GEOFENCE_TASK = "background-geofence-task";
const ADMIN_COORDS = {
	latitude: 37.7749,
	longitude: -122.4194,
}; // TODO: replace with the admin's real coordinates
const RADIUS_METERS = 200;
const NOTIFY_COOLDOWN_MS = 5 * 60 * 1000;
let lastNotifiedAt = 0;

Notifications.setNotificationHandler({
	handleNotification: async () => ({
		shouldShowAlert: true,
		shouldPlaySound: true,
		shouldSetBadge: false,
		shouldShowBanner: true,
		shouldShowList: true,
	}),
});

const haversineDistanceMeters = (
	from: Location.LocationObjectCoords,
	to: Location.LocationObjectCoords
) => {
	const toRad = (deg: number) => (deg * Math.PI) / 180;
	const R = 6371e3;
	const φ1 = toRad(from.latitude);
	const φ2 = toRad(to.latitude);
	const Δφ = toRad(to.latitude - from.latitude);
	const Δλ = toRad(to.longitude - from.longitude);
	const a =
		Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
		Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
	return R * c;
};

if (!TaskManager.isTaskDefined(GEOFENCE_TASK)) {
	TaskManager.defineTask(
		GEOFENCE_TASK,
		async ({ data, error }: TaskManager.TaskManagerTaskBody) => {
			if (error) return;
			const { locations } = (data || {}) as {
				locations?: Location.LocationObject[];
			};
			if (!locations || locations.length === 0) return;

			const current = locations[0].coords;
			const distance = haversineDistanceMeters(current, {
				latitude: ADMIN_COORDS.latitude,
				longitude: ADMIN_COORDS.longitude,
				altitude: 0,
				accuracy: 0,
				heading: 0,
				speed: 0,
				altitudeAccuracy: null,
			});

			const now = Date.now();
			if (
				distance <= RADIUS_METERS &&
				now - lastNotifiedAt > NOTIFY_COOLDOWN_MS
			) {
				lastNotifiedAt = now;
				await Notifications.scheduleNotificationAsync({
					content: {
						title: "Near admin",
						body: `Within ${RADIUS_METERS}m of admin at ${current.latitude.toFixed(
							5
						)}, ${current.longitude.toFixed(5)}`,
					},
					trigger: null,
				});
			}
		}
	);
}

export default function Index() {
	const [tracking, setTracking] = useState(false);
	const [statusText, setStatusText] = useState("Tracking is stopped");

	useEffect(() => {
		const init = async () => {
			await configureNotifications();
			const running = await Location.hasStartedLocationUpdatesAsync(
				GEOFENCE_TASK
			);
			setTracking(running);
			setStatusText(
				running ? "Tracking is running" : "Tracking is stopped"
			);
		};
		init();
	}, []);

	const configureNotifications = async () => {
		if (Platform.OS === "android") {
			await Notifications.setNotificationChannelAsync("default", {
				name: "default",
				importance: Notifications.AndroidImportance.HIGH,
				sound: "default",
			});
		}
	};

	const requestPermissions = async () => {
		const fg = await Location.requestForegroundPermissionsAsync();
		if (fg.status !== "granted") {
			Alert.alert(
				"Permission needed",
				"Foreground location is required."
			);
			return false;
		}
		const bg = await Location.requestBackgroundPermissionsAsync();
		if (bg.status !== "granted") {
			Alert.alert(
				"Background permission needed",
				"Background location is required to detect proximity while the app is closed."
			);
			return false;
		}
		const notifStatus = await Notifications.getPermissionsAsync();
		if (notifStatus.status !== "granted") {
			const ask = await Notifications.requestPermissionsAsync();
			if (ask.status !== "granted") {
				Alert.alert("Permission needed", "Notifications are required.");
				return false;
			}
		}
		return true;
	};

	const startTracking = async () => {
		const ok = await requestPermissions();
		if (!ok) return;

		await Location.startLocationUpdatesAsync(GEOFENCE_TASK, {
			accuracy: Location.Accuracy.Balanced,
			distanceInterval: 50,
			timeInterval: 60 * 1000,
			pausesUpdatesAutomatically: false,
			showsBackgroundLocationIndicator: true,
			foregroundService: {
				notificationTitle: "Location active",
				notificationBody: "Tracking distance to admin",
			},
		});
		setTracking(true);
		setStatusText("Tracking is running");
	};

	const stopTracking = async () => {
		const running = await Location.hasStartedLocationUpdatesAsync(
			GEOFENCE_TASK
		);
		if (running) {
			await Location.stopLocationUpdatesAsync(GEOFENCE_TASK);
		}
		setTracking(false);
		setStatusText("Tracking is stopped");
	};

	const logPushToken = async () => {
		// For sending to the admin device via your backend. Replace with your projectId if needed.
		const projectId =
			Constants.expoConfig?.extra?.eas?.projectId ||
			Constants.easConfig?.projectId;
		if (!projectId) {
			Alert.alert(
				"Missing projectId",
				"Set EAS projectId to get an Expo push token."
			);
			return;
		}
		const token = await Notifications.getExpoPushTokenAsync({ projectId });
		Alert.alert("Push token", token.data);
	};

	return (
		<View style={styles.container}>
			<Text style={styles.title}>Admin proximity tracker</Text>
			<Text style={styles.status}>{statusText}</Text>
			<View style={styles.buttonRow}>
				<Button
					title='Start tracking'
					onPress={startTracking}
					disabled={tracking}
				/>
				<Button
					title='Stop tracking'
					onPress={stopTracking}
					disabled={!tracking}
				/>
			</View>
			<View style={styles.infoBox}>
				<Text style={styles.label}>Admin location:</Text>
				<Text>
					{ADMIN_COORDS.latitude}, {ADMIN_COORDS.longitude} (edit in
					code)
				</Text>
				<Text style={styles.label}>Radius: {RADIUS_METERS} meters</Text>
			</View>
			<Button title='Show Expo push token' onPress={logPushToken} />
			<Text style={styles.note}>
				This app will run a foreground service on Android and keep
				checking your distance to the admin location in the background.
				Replace the admin coordinates and wire the push token to your
				backend to notify the admin device.
			</Text>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		justifyContent: "center",
		alignItems: "center",
		padding: 24,
		gap: 12,
	},
	title: {
		fontSize: 20,
		fontWeight: "bold",
	},
	status: {
		fontSize: 16,
	},
	buttonRow: {
		flexDirection: "row",
		gap: 12,
	},
	infoBox: {
		padding: 12,
		borderWidth: 1,
		borderColor: "#ccc",
		borderRadius: 8,
		width: "100%",
	},
	label: {
		fontWeight: "bold",
	},
	note: {
		fontSize: 12,
		color: "#555",
	},
});
