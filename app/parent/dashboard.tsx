import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
	ScrollView,
	StyleSheet,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { useStore } from "../../store/useStore";
import { formatLastSeen, isOnline } from "../../utils/time";

export default function ParentDashboard() {
	const router = useRouter();
	const { childData, subscribeLocation, subscribeDevice, refreshChildData } =
		useStore();
	const [refreshing, setRefreshing] = useState(false);

	useEffect(() => {
		if (childData?.id) {
			subscribeLocation(childData.id);
			subscribeDevice(childData.id);
		}
	}, [childData?.id]);

	if (!childData) {
		return (
			<View style={styles.container}>
				<Text>No device connected.</Text>
			</View>
		);
	}

	const features = [
		{
			id: "location",
			title: "Location",
			icon: "location-sharp",
			color: "#FF5252",
			route: "/parent/location",
			Library: Ionicons,
		},
		{
			id: "gallery",
			title: "Gallery",
			icon: "images",
			color: "#7B1FA2",
			route: "/parent/gallery",
			Library: Ionicons,
		},
		{
			id: "calls",
			title: "Call Logs",
			icon: "call",
			color: "#4CAF50",
			route: "/parent/calls",
			Library: Ionicons,
		},
		{
			id: "sms",
			title: "Messages",
			icon: "message",
			color: "#FF9800",
			route: "/parent/sms",
			Library: MaterialIcons,
		},
	];

	return (
		<View style={styles.container}>
			<View style={styles.header}>
				<View style={styles.headerTop}>
					<Text style={styles.headerTitle}>Dashboard</Text>
					<View
						style={{
							flexDirection: "row",
							alignItems: "center",
							gap: 12,
						}}>
						<TouchableOpacity
							onPress={async () => {
								setRefreshing(true);
								await refreshChildData();
								setRefreshing(false);
							}}>
							<Ionicons
								name={refreshing ? "reload" : "refresh-outline"}
								size={24}
								color='#333'
							/>
						</TouchableOpacity>
						<TouchableOpacity onPress={() => router.replace("/")}>
							<Ionicons
								name='log-out-outline'
								size={24}
								color='#333'
							/>
						</TouchableOpacity>
					</View>
				</View>

				<View style={styles.deviceCard}>
					<View style={styles.deviceInfo}>
						<View style={styles.avatar}>
							<Text style={styles.avatarText}>
								{childData.name[0]}
							</Text>
						</View>
						<View>
							<Text style={styles.deviceName}>
								{childData.name}
							</Text>
							<View style={styles.statusRow}>
								<View
									style={[
										styles.statusDot,
										{
											backgroundColor: isOnline(
												childData.lastSeen
											)
												? "#4CAF50"
												: "#999",
										},
									]}
								/>
								<Text style={styles.statusText}>
									{isOnline(childData.lastSeen)
										? "Online"
										: "Offline"}{" "}
									• Battery:{" "}
									{Math.round(childData.batteryLevel)}%
								</Text>
							</View>
						</View>
					</View>
					<View style={styles.lastSeen}>
						<Text style={styles.lastSeenText}>
							Last seen: {formatLastSeen(childData.lastSeen)}
						</Text>
					</View>
				</View>
			</View>

			<ScrollView contentContainerStyle={styles.grid}>
				{features.map((feature) => (
					<TouchableOpacity
						key={feature.id}
						style={styles.card}
						onPress={() => router.push(feature.route as any)}>
						<View
							style={[
								styles.iconBox,
								{ backgroundColor: feature.color },
							]}>
							<feature.Library
								name={feature.icon as any}
								size={30}
								color='#fff'
							/>
						</View>
						<Text style={styles.cardTitle}>{feature.title}</Text>
						<Ionicons
							name='chevron-forward'
							size={20}
							color='#ccc'
							style={styles.arrow}
						/>
					</TouchableOpacity>
				))}
			</ScrollView>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F5F7FA",
	},
	header: {
		padding: 20,
		paddingTop: 60,
		backgroundColor: "#fff",
		borderBottomLeftRadius: 30,
		borderBottomRightRadius: 30,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.05,
		shadowRadius: 10,
		elevation: 5,
		marginBottom: 20,
	},
	headerTop: {
		flexDirection: "row",
		justifyContent: "space-between",
		alignItems: "center",
		marginBottom: 20,
	},
	headerTitle: {
		fontSize: 28,
		fontWeight: "bold",
		color: "#333",
	},
	deviceCard: {
		backgroundColor: "#F0F4F8",
		borderRadius: 20,
		padding: 20,
	},
	deviceInfo: {
		flexDirection: "row",
		alignItems: "center",
		marginBottom: 15,
	},
	avatar: {
		width: 50,
		height: 50,
		borderRadius: 25,
		backgroundColor: "#4A90E2",
		justifyContent: "center",
		alignItems: "center",
		marginRight: 15,
	},
	avatarText: {
		color: "#fff",
		fontSize: 20,
		fontWeight: "bold",
	},
	deviceName: {
		fontSize: 18,
		fontWeight: "bold",
		color: "#333",
		marginBottom: 4,
	},
	statusRow: {
		flexDirection: "row",
		alignItems: "center",
	},
	statusDot: {
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: "#4CAF50",
		marginRight: 6,
	},
	statusText: {
		fontSize: 14,
		color: "#666",
	},
	lastSeen: {
		borderTopWidth: 1,
		borderTopColor: "rgba(0,0,0,0.05)",
		paddingTop: 10,
	},
	lastSeenText: {
		fontSize: 12,
		color: "#999",
		textAlign: "right",
	},
	grid: {
		padding: 20,
		gap: 15,
	},
	card: {
		flexDirection: "row",
		alignItems: "center",
		backgroundColor: "#fff",
		padding: 20,
		borderRadius: 20,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 2 },
		shadowOpacity: 0.05,
		shadowRadius: 5,
		elevation: 2,
	},
	iconBox: {
		width: 50,
		height: 50,
		borderRadius: 15,
		justifyContent: "center",
		alignItems: "center",
		marginRight: 20,
	},
	cardTitle: {
		fontSize: 18,
		fontWeight: "600",
		color: "#333",
		flex: 1,
	},
	arrow: {
		opacity: 0.5,
	},
});
