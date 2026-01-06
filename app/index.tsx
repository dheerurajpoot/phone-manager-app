import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useStore } from "../store/useStore";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
// import { LinearGradient } from 'expo-linear-gradient'; // Commented out to avoid missing module error
import { useEffect } from "react";

// We will use standard View with background color for now to avoid extra dependencies if possible,
// but LinearGradient is in expo-linear-gradient. Let's stick to simple styles first or install it.
// Actually, let's make it look good with simple colors.

export default function RoleSelectionScreen() {
	const router = useRouter();
	const setRole = useStore((state) => state.setRole);
	const { initializeFromStorage } = useStore();

	useEffect(() => {
		initializeFromStorage().then(() => {
			const role = useStore.getState().userRole;
			const cid = useStore.getState().childId;
			if (role === "child" && cid) {
				router.replace("/child/dashboard");
			} else if (role === "parent") {
				router.replace("/parent/connect");
			}
		});
	}, []);

	const handleSelectRole = (role: "parent" | "child") => {
		setRole(role);
		if (role === "child") {
			router.push("/child/setup");
		} else {
			router.push("/parent/connect");
		}
	};

	return (
		<View style={styles.container}>
			<StatusBar style='dark' />
			<View style={styles.header}>
				<Text style={styles.title}>Welcome to FamilyGuard</Text>
				<Text style={styles.subtitle}>
					Choose your role to get started
				</Text>
			</View>

			<View style={styles.content}>
				<TouchableOpacity
					style={[styles.card, styles.parentCard]}
					onPress={() => handleSelectRole("parent")}>
					<View style={styles.iconContainer}>
						<Ionicons name='person' size={40} color='#fff' />
					</View>
					<View style={styles.cardTextContainer}>
						<Text style={styles.cardTitle}>Parent</Text>
						<Text style={styles.cardDescription}>
							Monitor and manage your child's device.
						</Text>
					</View>
					<Ionicons name='chevron-forward' size={24} color='#fff' />
				</TouchableOpacity>

				<TouchableOpacity
					style={[styles.card, styles.childCard]}
					onPress={() => handleSelectRole("child")}>
					<View style={styles.iconContainer}>
						<Ionicons
							name='phone-portrait'
							size={40}
							color='#fff'
						/>
					</View>
					<View style={styles.cardTextContainer}>
						<Text style={styles.cardTitle}>Child</Text>
						<Text style={styles.cardDescription}>
							Install on the device you want to protect.
						</Text>
					</View>
					<Ionicons name='chevron-forward' size={24} color='#fff' />
				</TouchableOpacity>
			</View>
		</View>
	);
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		backgroundColor: "#F5F7FA",
		padding: 20,
		justifyContent: "center",
	},
	header: {
		marginBottom: 40,
		alignItems: "center",
	},
	title: {
		fontSize: 28,
		fontWeight: "bold",
		color: "#1A1A1A",
		marginBottom: 10,
	},
	subtitle: {
		fontSize: 16,
		color: "#666",
	},
	content: {
		gap: 20,
	},
	card: {
		flexDirection: "row",
		alignItems: "center",
		padding: 20,
		borderRadius: 16,
		shadowColor: "#000",
		shadowOffset: { width: 0, height: 4 },
		shadowOpacity: 0.1,
		shadowRadius: 8,
		elevation: 5,
		height: 120,
	},
	parentCard: {
		backgroundColor: "#4A90E2", // Blue
	},
	childCard: {
		backgroundColor: "#50E3C2", // Teal
	},
	iconContainer: {
		width: 60,
		height: 60,
		borderRadius: 30,
		backgroundColor: "rgba(255,255,255,0.2)",
		justifyContent: "center",
		alignItems: "center",
		marginRight: 15,
	},
	cardTextContainer: {
		flex: 1,
	},
	cardTitle: {
		fontSize: 22,
		fontWeight: "bold",
		color: "#fff",
		marginBottom: 5,
	},
	cardDescription: {
		fontSize: 14,
		color: "rgba(255,255,255,0.9)",
	},
});
