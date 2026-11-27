function checkPortfolioAlerts() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Alerts");
  var lastRow = sheet.getLastRow();
  
  if (lastRow < 2) return;
  
  // Adjust range if needed: Col A (1) is Ticker, Col F (6) is Alert
  var range = sheet.getRange(2, 1, lastRow - 1, 6); 
  var values = range.getValues();
  
  var alertMessages = [];
  var triggeredTickers = [];

  // Get script properties to remember previous alerts
  var scriptProperties = PropertiesService.getScriptProperties();
  
  for (var i = 0; i < values.length; i++) {
    var ticker = values[i][0];
    var status = values[i][4]; // Index 4 represents Column E
    var isAlertOn = values[i][5]; // Index 5 represents Column F (On/Off)

    // Ignore rows where ticker is empty or status is #N/A (Google Finance sync error)
    if (status === "#N/A" || String(status).indexOf("#N/A") !== -1) {
      continue;
    }

    // Check if the alert toggle is set to "On"
    if (String(isAlertOn).trim().toUpperCase() === "ON") {

      // Read the last recorded alert status for this specific ticker from memory
      var lastAlertStatus = scriptProperties.getProperty(ticker) || "Normal";
      
      // If status exists and is NOT "Normal", trigger an alert
      if (status && status !== "Normal") {
        // Check if this current status is "worse" than the last one we emailed about
        // (We check if the previous status was Normal or a shallower drop)
        if (isWorseDrop(status, lastAlertStatus)) {
          alertMessages.push("• " + ticker + "  ➔  " + status);
          triggeredTickers.push(ticker);
          
          // Save this new worse status into memory so we don't email again for it
          scriptProperties.setProperty(ticker, status);
        }
      } else {
        // If the asset fully recovered back to "Normal", reset its memory so future drops will alert again
        scriptProperties.setProperty(ticker, "Normal");
      }
      
    }    
  }
  
  // If alerts exist, send an email to your account
  if (alertMessages.length > 0) {
    var email = Session.getActiveUser().getEmail(); 

    var subject = "";
    if (triggeredTickers.length === 1) {
      subject = "🚨 Portfolio Alert: " + triggeredTickers[0] + " Threshold Reached";
    } else {
      subject = "🚨 Portfolio Alert: " + triggeredTickers.join(", ") + " Threshold Reached";
    }

    var body = "Hi there,\n\n" +
               "Your automated portfolio tracker has detected that one or more assets have breached your price drop thresholds:\n\n" +
               alertMessages.join("\n") + "\n\n" +
               "Stay disciplined,\n" +
               "Your Portfolio Assistant";

    MailApp.sendEmail(email, subject, body);
  }
}

// Helper function to compare severity levels
function isWorseDrop(currentStatus, lastStatus) {
  if (lastStatus === "Normal") return true;
  
  // Extract the drop percentage number from the text string (e.g., "Down 10%+" -> 10)
  var currentPct = extractPercentage(currentStatus);
  var lastPct = extractPercentage(lastStatus);
  
  // Current drop is worse if the percentage number is higher
  return currentPct > lastPct;
}

// Helper function to pull the integer number out of status string
function extractPercentage(statusStr) {
  var match = statusStr.match(/(\d+)%/);
  return match ? parseInt(match[1]) : 0;
}