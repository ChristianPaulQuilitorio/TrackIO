<?php
require_once 'db.php';

header("Content-Type: application/json");

$data = json_decode(file_get_contents("php://input"), true);

$uid = $data['uid'] ?? '';
$email = $data['email'] ?? '';
$firstName = $data['firstName'] ?? '';
$lastName = $data['lastName'] ?? '';
$verificationCode = $data['verificationCode'] ?? '';

if ($uid && $email && $firstName && $lastName) {
    $stmt = $conn->prepare("SELECT id FROM students WHERE firebase_uid = ?");
    $stmt->bind_param("s", $uid);
    $stmt->execute();
    $stmt->store_result();

    if ($stmt->num_rows > 0) {
        echo json_encode(["status" => "exists"]);
    } else {
        $stmt->close();
        $stmt = $conn->prepare("INSERT INTO students (firebase_uid, email, first_name, last_name) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("ssss", $uid, $email, $firstName, $lastName);

        if ($stmt->execute()) {
            echo json_encode(["status" => "success"]);
        } else {
            echo json_encode(["status" => "error", "message" => $stmt->error]);
        }
    }

    $stmt->close();
} else {
    echo json_encode(["status" => "error", "message" => "Missing required fields."]);
}

$conn->close();
?>
