$body = @{
    userId = "3dfd7ac0-8b57-46df-8232-9efe2750183c"
    message = "I have fever and headache"
    language = "en"
    patientInfo = @{
        age = 30
        gender = "male"
    }
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:3000/api/voice-assistant/analyze" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body `
    -UseBasicParsing

Write-Host "Status Code: $($response.StatusCode)"
Write-Host "Response:"
$response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
