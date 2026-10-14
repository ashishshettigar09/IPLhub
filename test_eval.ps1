$screenshotPath = "C:\Users\ashis\.gemini\antigravity-ide\scratch\ipl-auction-hub\screenshot_test.png"
if (Test-Path $screenshotPath) { Remove-Item $screenshotPath }

& "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe" --headless --window-size=1600,1000 --allow-file-access-from-files --screenshot=$screenshotPath "file:///C:/Users/ashis/.gemini/antigravity-ide/scratch/ipl-auction-hub/index.html"

if (Test-Path $screenshotPath) {
  $fileInfo = Get-Item $screenshotPath
  Write-Host "Screenshot created successfully: $($fileInfo.Length) bytes"
} else {
  Write-Host "Screenshot failed"
}
