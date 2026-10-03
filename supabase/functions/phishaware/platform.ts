export type Employee={id:string;name:string;email:string;department:string;active:boolean;joined:string};
export type Campaign={id:string;name:string;templateId:string;subject:string;sender:string;body:string;department:string;status:'Draft'|'Active'|'Completed';created:string;launched?:string;due:string};
export type Delivery={id:string;campaignId:string;employeeId:string;opened:boolean;clicked:boolean;reported:boolean;created:string};
export type Completion={employeeId:string;moduleId:string;score:number;attempts:number;date:string};
export type Event={id:string;actor:string;action:string;type:'Campaign'|'Employee'|'Training'|'Simulation'|'Settings';date:string};
export type Notice={id:string;employeeId:string;text:string;read:boolean;date:string};
export type Workspace={version:1;organization:string;employees:Employee[];campaigns:Campaign[];deliveries:Delivery[];completions:Completion[];events:Event[];notices:Notice[];sampleData:boolean};
export type Template={id:string;name:string;category:string;difficulty:'Beginner'|'Intermediate'|'Advanced';subject:string;sender:string;body:string;indicators:string[]};
export const templates:Template[]=[
 {id:'password',name:'Password expiry notice',category:'Credential request',difficulty:'Beginner',subject:'Action required: your password expires today',sender:'support@account-security.example.invalid',body:'Hello {{first_name}},\n\nYour account password expires at 5:00 PM today. To avoid losing access to your work files, confirm your account using the link below.\n\nThank you,\nAccount Support',indicators:['An unfamiliar sender domain','A short deadline designed to create urgency','A request to confirm account access through an unsolicited link']},
 {id:'invoice',name:'Unexpected supplier invoice',category:'Finance impersonation',difficulty:'Intermediate',subject:'Outstanding invoice: payment confirmation needed',sender:'billing@supplier-payments.example.invalid',body:'Hello {{first_name}},\n\nPlease review the outstanding invoice for your department. Payment is due today. Our banking details have changed. Use the link below to view the updated payment instructions.\n\nRegards,\nSupplier Accounts',indicators:['Unexpected payment instructions','A change of banking details','An unverified external sender']},
 {id:'benefits',name:'Employee benefits update',category:'HR impersonation',difficulty:'Intermediate',subject:'Review your updated employee benefits',sender:'people@benefits-update.example.invalid',body:'Hello {{first_name}},\n\nYour employee benefits profile needs verification. Confirm your details today to keep your benefits active for the next period.\n\nUse the link below to review your profile.\n\nPeople Operations',indicators:['A benefits-related request from an unrelated domain','Pressure to act to avoid losing benefits','An unexpected account verification link']},
 {id:'shared',name:'Shared document invitation',category:'Document sharing',difficulty:'Advanced',subject:'A confidential document was shared with you',sender:'notifications@document-access.example.invalid',body:'Hello {{first_name}},\n\nA colleague has shared a confidential planning document with you. Sign in through the secure document viewer below to review the file before the meeting.\n\nDocument Services',indicators:['The sender does not use your approved document-sharing domain','An unexpected confidential file','A sign-in request without independently verified context']}
];
export type TrainingModule={id:string;title:string;category:string;minutes:number;description:string;objectives:string[];sections:{title:string;text:string}[];scenario:{subject:string;sender:string;message:string;flags:string[];action:string};checklist:string[];questions:{prompt:string;options:string[];answer:number;explanation:string}[];resources:{label:string;url:string}[]};
export const modules:TrainingModule[]=[
 {
  "id": "senders",
  "title": "Spot phishing and impersonation",
  "category": "Foundations",
  "minutes": 7,
  "description": "Recognize misleading senders and verify unusual requests before acting.",
  "objectives": [
   "Identify phishing and impersonation",
   "Check the address and request together",
   "Choose an independent verification channel"
  ],
  "sections": [
   {
    "title": "Understand the request",
    "text": "Phishing uses deception to obtain information, money, or access. In a workday, an unexpected task might arrive among genuine messages. Ask who benefits from the action and whether the request matches your responsibilities."
   },
   {
    "title": "Separate a name from identity",
    "text": "A copied display name or logo is insufficient evidence of identity. Read the entire sender address. A different reply address deserves a check, but does not prove fraud by itself. An account belonging to a known person might also be compromised."
   },
   {
    "title": "Verify before following instructions",
    "text": "Consider context, not spelling alone. Polished messages still deserve scrutiny. If an instruction feels unusual, use a contact already in your directory or an approved company channel. Keep approvals in place even when the sender insists on urgency."
   }
  ],
  "scenario": {
   "subject": "Your staff profile closes today",
   "sender": "People Team <people@staff-review.example.invalid>",
   "message": "Hello Ama, verify your staff profile within 30 minutes to keep access. Reply with your password and approval code.",
   "flags": [
    "Unverified staff-review address",
    "Threat of losing access",
    "Request for account secrets"
   ],
   "action": "Contact your People Team through the company directory. Report the message without replying."
  },
  "checklist": [
   "Check the complete sender address",
   "Compare the request with expected work",
   "Verify unusual instructions independently",
   "Keep passwords and codes private"
  ],
  "questions": [
   {
    "prompt": "A familiar display name appears beside an unfamiliar address. Your next action?",
    "options": [
     "Follow the instruction",
     "Verify through the company directory",
     "Send a password to confirm identity"
    ],
    "answer": 1,
    "explanation": "A name alone does not establish identity."
   },
   {
    "prompt": "A message has correct spelling and your company logo. What follows?",
    "options": [
     "Trust the message",
     "Forward to everyone",
     "Still inspect the sender and requested action"
    ],
    "answer": 2,
    "explanation": "Presentation does not establish identity."
   },
   {
    "prompt": "Which instruction needs verification?",
    "options": [
     "An expected meeting reminder",
     "An urgent request for a password",
     "Your usual internal newsletter"
    ],
    "answer": 1,
    "explanation": "Account secrets should remain private."
   },
   {
    "prompt": "Where should you obtain a verification number?",
    "options": [
     "Your existing company directory",
     "The suspicious message",
     "A link supplied by the sender"
    ],
    "answer": 0,
    "explanation": "Use contact details obtained independently."
   },
   {
    "prompt": "A reply address differs from the sender. What does this mean?",
    "options": [
     "Fraud is proven",
     "The email is safe",
     "The mismatch needs context and verification"
    ],
    "answer": 2,
    "explanation": "A mismatch is a warning sign, not a verdict."
   }
  ],
  "resources": [
   {
    "label": "NIST: phishing guidance",
    "url": "https://www.nist.gov/itl/smallbusinesscyber/guidance-topic/phishing"
   }
  ]
 },
 {
  "id": "links",
  "title": "Handle links and attachments",
  "category": "Email safety",
  "minutes": 8,
  "description": "Recognize misleading destinations and handle unexpected files without exposing company data.",
  "objectives": [
   "Inspect a destination without opening the site",
   "Recognize unsafe file instructions",
   "Use approved checks for confidential files"
  ],
  "sections": [
   {
    "title": "Read the destination",
    "text": "On a desktop, hovering over a link often reveals the address. Do not open a suspicious destination to inspect the page. On a phone, use a preview only if your device supports viewing without navigation. Otherwise open the service from a known bookmark."
   },
   {
    "title": "Look at the host, not the branding",
    "text": "For this exercise, accounts.example.invalid.attacker.test belongs under attacker.test. A trusted-looking word elsewhere in the address does not change the host. HTTPS protects a connection but does not certify the sender or business. Training addresses here are examples, not links to visit."
   },
   {
    "title": "Treat files as part of the request",
    "text": "An unexpected invoice, archive, executable, or document asking for macros needs verification. Use your approved security process. Avoid uploading confidential files to public scanning services. A clean scan supports assessment, but does not prove a file harmless."
   }
  ],
  "scenario": {
   "subject": "Open the revised invoice",
   "sender": "Accounts <billing@invoice-review.example.invalid>",
   "message": "Please open Invoice.zip, run the included viewer, and disable security warnings if the document will not load.",
   "flags": [
    "Unexpected archive",
    "Request to run software",
    "Instruction to disable protection"
   ],
   "action": "Do not run the viewer. Verify the invoice with your known supplier contact and report the message."
  },
  "checklist": [
   "Inspect the destination without visiting",
   "Open known services from a bookmark",
   "Keep macros and security protections unchanged",
   "Send suspicious files through approved reporting channels"
  ],
  "questions": [
   {
    "prompt": "A login message arrives unexpectedly. How should you reach the service?",
    "options": [
     "Click immediately",
     "Use the known bookmark",
     "Reply for another link"
    ],
    "answer": 1,
    "explanation": "A known route avoids the supplied destination."
   },
   {
    "prompt": "Does HTTPS alone prove a website trustworthy?",
    "options": [
     "Yes",
     "Only with a company logo",
     "No"
    ],
    "answer": 2,
    "explanation": "Encryption does not establish legitimacy."
   },
   {
    "prompt": "Which host controls accounts.example.invalid.attacker.test?",
    "options": [
     "attacker.test",
     "accounts.example.invalid",
     "The displayed brand"
    ],
    "answer": 0,
    "explanation": "Read the actual host rather than a familiar word."
   },
   {
    "prompt": "An invoice asks you to enable macros. What should you do?",
    "options": [
     "Enable them",
     "Verify the request through a trusted contact",
     "Disable your antivirus"
    ],
    "answer": 1,
    "explanation": "Do not activate content in an unverified file."
   },
   {
    "prompt": "A confidential attachment needs checking. Where should you send the file?",
    "options": [
     "Any public scanning website",
     "A public chat group",
     "Your approved security process"
    ],
    "answer": 2,
    "explanation": "Avoid exposing company information during a check."
   }
  ],
  "resources": [
   {
    "label": "Google: avoid and report phishing",
    "url": "https://support.google.com/mail/answer/8253?hl=en"
   }
  ]
 },
 {
  "id": "report",
  "title": "Report and respond to suspicious email",
  "category": "Incident response",
  "minutes": 8,
  "description": "Know how to report concerns and respond after clicking, sharing information, or running a file.",
  "objectives": [
   "Report useful details without exposing secrets",
   "Distinguish reporting from marking a notification read",
   "Choose next steps after different exposures"
  ],
  "sections": [
   {
    "title": "Send a useful report",
    "text": "In PhishAware, open Email protection and choose Report suspicious on the finding. A summary goes to your company administrators. Provide the time and actions taken through your approved support channel. Never include passwords, approval codes, or confidential attachments in a complaint."
   },
   {
    "title": "After a click or credential entry",
    "text": "Stop interacting with the page and contact your security team. Explain whether you clicked, downloaded, entered a password, or approved a prompt. If credentials were entered, use the official service from a trusted device to change the affected password and review account security with your team."
   },
   {
    "title": "After running a file or sending money",
    "text": "If a file ran or a device behaves unusually, contact your IT team using another device and follow their containment procedure. Avoid deleting evidence or wiping the device. If money moved, contact your finance team and bank immediately through known numbers. Prompt reporting supports investigation."
   }
  ],
  "scenario": {
   "subject": "I entered my password",
   "sender": "Employee incident example",
   "message": "Kofi followed a document link and typed his work password. The page then requested a second approval. He stopped before approving.",
   "flags": [
    "Password entered on an unverified page",
    "Further approval requested"
   ],
   "action": "Report the credential exposure immediately. Use the official account service and follow security-team instructions for password, sessions, and recovery settings."
  },
  "checklist": [
   "Stop further interaction",
   "Report the time and actions taken",
   "Never share passwords in reports",
   "Keep evidence for your security team"
  ],
  "questions": [
   {
    "prompt": "You entered a password on an unverified page. What comes next?",
    "options": [
     "Hide the event",
     "Use the official account service and notify security",
     "Use the same page to reset"
    ],
    "answer": 1,
    "explanation": "Use a trusted route and report the exposure."
   },
   {
    "prompt": "Does Mark as read report a suspicious email?",
    "options": [
     "No, use Report suspicious",
     "Yes, both buttons do the same job",
     "Yes, and deletes the email"
    ],
    "answer": 0,
    "explanation": "Acknowledgement and incident reporting are separate actions."
   },
   {
    "prompt": "Which details belong in an incident report?",
    "options": [
     "Your password",
     "Your MFA recovery codes",
     "Time, sender, subject, and actions taken"
    ],
    "answer": 2,
    "explanation": "Provide context while keeping secrets private."
   },
   {
    "prompt": "You ran an unexpected file. What is a suitable response?",
    "options": [
     "Wipe the device yourself",
     "Contact IT and follow containment instructions",
     "Forward the file to coworkers"
    ],
    "answer": 1,
    "explanation": "Follow your incident procedure and preserve evidence."
   },
   {
    "prompt": "You sent money after an unverified request. What should happen first?",
    "options": [
     "Wait until tomorrow",
     "Delete the conversation",
     "Contact finance and the bank through known channels"
    ],
    "answer": 2,
    "explanation": "Prompt contact supports an attempted recovery."
   }
  ],
  "resources": [
   {
    "label": "Google: secure a compromised account",
    "url": "https://support.google.com/accounts/answer/6294825?hl=en"
   }
  ]
 },
 {
  "id": "finance",
  "title": "Verify payments and executive requests",
  "category": "Business email compromise",
  "minutes": 8,
  "description": "Check invoices, bank detail changes, gift card requests, and urgent instructions.",
  "objectives": [
   "Identify payment and executive impersonation",
   "Verify a bank detail change separately",
   "Follow approval rules under pressure"
  ],
  "sections": [
   {
    "title": "Recognize the pattern",
    "text": "Business email compromise exploits workplace trust. A sender posing as a supplier, executive, or employee might request a transfer, gift cards, or changed payment details. The request might arrive in an existing thread, so a familiar conversation alone is insufficient."
   },
   {
    "title": "Use a separate approval channel",
    "text": "Call a verified contact using the number already held in your supplier or company records. Confirm changes before editing payment details. Follow dual approval and transaction limits wherever your organization requires them. Keep a record of verification through your approved process."
   },
   {
    "title": "Escalate pressure and secrecy",
    "text": "An instruction to skip checks or keep a transfer secret needs escalation. Email tone, logos, and voice recordings do not replace approval. If a transfer occurred, notify your finance lead and financial institution immediately through established channels."
   }
  ],
  "scenario": {
   "subject": "Bank details changed, settle today",
   "sender": "Supplier accounts <accounts@supplier-change.example.invalid>",
   "message": "Our previous account is unavailable. Send GHS 18,500 to this replacement account before 3 PM. Please skip the usual callback because the finance lead is busy.",
   "flags": [
    "Changed bank details",
    "Pressure to bypass verification",
    "Deadline attached to an unverified transfer"
   ],
   "action": "Pause the payment. Call the supplier using your existing records and follow company approval rules."
  },
  "checklist": [
   "Verify changes with an existing supplier contact",
   "Keep payment approvals in place",
   "Escalate secrecy or bypass requests",
   "Report suspected fraud promptly"
  ],
  "questions": [
   {
    "prompt": "A supplier changes bank details in a familiar thread. Your response?",
    "options": [
     "Pay because the thread is old",
     "Verify through the existing supplier number",
     "Use the new number in the email"
    ],
    "answer": 1,
    "explanation": "A familiar thread does not replace verification."
   },
   {
    "prompt": "An executive requests gift card codes in secret. What should you do?",
    "options": [
     "Buy and send codes",
     "Ask the sender for another address",
     "Verify and escalate through approved channels"
    ],
    "answer": 2,
    "explanation": "Urgent secret purchases need verification."
   },
   {
    "prompt": "Which number should you use for a bank detail check?",
    "options": [
     "The established supplier record",
     "A replacement number in the request",
     "The email signature alone"
    ],
    "answer": 0,
    "explanation": "Use independently held details."
   },
   {
    "prompt": "A senior manager asks you to skip dual approval. What follows?",
    "options": [
     "Skip approval",
     "Follow the policy and escalate",
     "Ask a friend to approve"
    ],
    "answer": 1,
    "explanation": "Authority does not remove company controls."
   },
   {
    "prompt": "A fraudulent transfer was made. Who needs prompt contact?",
    "options": [
     "Only coworkers",
     "No one until the supplier replies",
     "Finance and the financial institution"
    ],
    "answer": 2,
    "explanation": "Early contact supports investigation and recovery attempts."
   }
  ],
  "resources": [
   {
    "label": "FBI: business email compromise",
    "url": "https://www.fbi.gov/how-we-can-help-you/common-frauds-and-scams/business-email-compromise"
   }
  ]
 },
 {
  "id": "accounts",
  "title": "Protect passwords and sign-in approvals",
  "category": "Account security",
  "minutes": 8,
  "description": "Use unique passwords, approved managers, and multifactor authentication without sharing secrets.",
  "objectives": [
   "Keep account secrets separate",
   "Reject unrequested MFA approvals",
   "Understand phishing-resistant sign-in methods"
  ],
  "sections": [
   {
    "title": "Protect each account",
    "text": "Use a unique password for each service and your organization's approved password manager. Reusing a work password elsewhere exposes the work account when another service is breached. Never send passwords or recovery codes in an email, call, or support form."
   },
   {
    "title": "Approve only your own sign-ins",
    "text": "MFA adds another check, but codes and push approvals still need care. Reject prompts you did not initiate and report repeated prompts. An alleged support caller asking for a code is asking for an account secret. Open the official service to review activity."
   },
   {
    "title": "Use stronger sign-in methods",
    "text": "Passkeys and supported security keys resist common phishing attempts better than typed codes. Use methods approved for your work account. Protect recovery information, keep backup methods current, and contact your administrator if a work authentication device is lost."
   }
  ],
  "scenario": {
   "subject": "IT needs your approval code",
   "sender": "Service desk caller example",
   "message": "A caller says your mailbox needs repair and asks for the six-digit sign-in code. Two approval prompts arrive while you are speaking.",
   "flags": [
    "Code requested by another person",
    "Prompts you did not initiate"
   ],
   "action": "Reject the prompts. End the call and contact your real service desk through the directory."
  },
  "checklist": [
   "Use unique passwords",
   "Keep codes and recovery keys private",
   "Reject unrequested approvals",
   "Use approved passkeys or security keys where available"
  ],
  "questions": [
   {
    "prompt": "A support caller requests your one-time sign-in code. Your response?",
    "options": [
     "Share the code",
     "Keep the code private and contact known support",
     "Send a screenshot"
    ],
    "answer": 1,
    "explanation": "A code is an account secret."
   },
   {
    "prompt": "Which action reduces exposure from password reuse?",
    "options": [
     "Use the same password everywhere",
     "Add a year to every password",
     "Use a unique password for each account"
    ],
    "answer": 2,
    "explanation": "Separate secrets limit reuse across accounts."
   },
   {
    "prompt": "An MFA prompt arrives without a sign-in attempt. What should you do?",
    "options": [
     "Reject and report",
     "Approve to stop the notifications",
     "Ask a coworker to approve"
    ],
    "answer": 0,
    "explanation": "Unrequested approvals deserve investigation."
   },
   {
    "prompt": "Which supported method offers phishing-resistant authentication?",
    "options": [
     "A password emailed to IT",
     "A passkey or supported security key",
     "A shared approval code"
    ],
    "answer": 1,
    "explanation": "These methods bind authentication to the intended service."
   },
   {
    "prompt": "Your work security key is lost. What is appropriate?",
    "options": [
     "Borrow a colleague's account",
     "Turn off all protection",
     "Contact your administrator and follow recovery rules"
    ],
    "answer": 2,
    "explanation": "Use approved recovery without sharing another account."
   }
  ],
  "resources": [
   {
    "label": "NIST: multifactor authentication",
    "url": "https://www.nist.gov/itl/smallbusinesscyber/guidance-topic/multi-factor-authentication"
   }
  ]
 },
 {
  "id": "mobile",
  "title": "Recognize QR codes, texts, and phone scams",
  "category": "Mobile awareness",
  "minutes": 7,
  "description": "Apply verification habits to phones, chat messages, QR codes, and voice calls.",
  "objectives": [
   "Treat QR codes as links",
   "Verify unexpected chat or text requests",
   "Respond to requests for remote access"
  ],
  "sections": [
   {
    "title": "Preview a QR destination",
    "text": "A QR code carries a destination without displaying the full address in the message. Before proceeding, inspect the address shown by your scanner. If a message demands a work sign-in, open the approved service independently. Codes in email or on a pasted sticker still need context."
   },
   {
    "title": "Check requests across channels",
    "text": "The same decision rules apply to SMS, WhatsApp, social messages, and calls. A courier fee or payroll update might be expected, but an unusual demand still needs a separate check. Use a known app or contact, rather than a destination supplied in the message."
   },
   {
    "title": "Keep control of your device",
    "text": "Do not install remote access software or read out codes for an unverified caller. Hang up and contact your service desk through established details. A familiar voice or incoming caller name is insufficient proof of identity."
   }
  ],
  "scenario": {
   "subject": "Scan to retain staff Wi-Fi",
   "sender": "Facilities <wifi-reset.example.invalid>",
   "message": "Scan this QR code and enter your work email password now. Do not contact IT because the network migration is confidential.",
   "flags": [
    "Unexpected sign-in via QR code",
    "Password requested",
    "Discourages independent verification"
   ],
   "action": "Open your known staff portal or contact IT through the company directory. Avoid scanning to sign in."
  },
  "checklist": [
   "Inspect QR destinations before proceeding",
   "Reach services through approved apps",
   "Verify calls independently",
   "Keep remote access under approved IT control"
  ],
  "questions": [
   {
    "prompt": "A QR code demands an unexpected work sign-in. What is appropriate?",
    "options": [
     "Scan and sign in immediately",
     "Use the known service or contact IT",
     "Send the code to everyone"
    ],
    "answer": 1,
    "explanation": "A QR code is another form of link."
   },
   {
    "prompt": "Does a familiar caller name prove identity?",
    "options": [
     "Yes",
     "Only during office hours",
     "No"
    ],
    "answer": 2,
    "explanation": "Verify identity through a separate trusted channel."
   },
   {
    "prompt": "A courier text asks for a fee. Where should you check?",
    "options": [
     "The known courier app or website",
     "The text link alone",
     "The reply number alone"
    ],
    "answer": 0,
    "explanation": "Use an independently trusted destination."
   },
   {
    "prompt": "An unknown caller asks you to install remote access software. Your response?",
    "options": [
     "Install immediately",
     "Refuse and contact known IT support",
     "Share your work password first"
    ],
    "answer": 1,
    "explanation": "Unverified remote access exposes your device."
   },
   {
    "prompt": "Why inspect a QR destination?",
    "options": [
     "Every QR code is malicious",
     "Scanning removes all risk",
     "The destination is hidden until previewed"
    ],
    "answer": 2,
    "explanation": "Assess the destination and request together."
   }
  ],
  "resources": [
   {
    "label": "NCSC: QR code risks",
    "url": "https://www.ncsc.gov.uk/blog-post/qr-codes-whats-real-risk"
   }
  ]
 },
 {
  "id": "sharing",
  "title": "Handle shared documents and data requests",
  "category": "Data protection",
  "minutes": 7,
  "description": "Verify shared files and avoid exposing sensitive information through unusual requests.",
  "objectives": [
   "Check document invitations in context",
   "Confirm who needs access",
   "Keep confidential content out of public tools"
  ],
  "sections": [
   {
    "title": "Verify an unexpected invitation",
    "text": "A document-sharing notice might be genuine while the document or requester is untrusted. Check who shared the file and why you need access. Use your known work application to find the document. Do not trust a separate login page because the email uses a familiar logo."
   },
   {
    "title": "Check the requested access",
    "text": "Before sharing staff lists, customer information, or internal files, confirm the recipient, purpose, and approval. Avoid broad public permissions for work documents. Use your organization's approved sharing settings and ask your administrator when an external request is unclear."
   },
   {
    "title": "Protect information while seeking help",
    "text": "Report a suspicious file using approved tools. In PhishAware feedback, describe the problem without copying confidential document contents, passwords, or attachments. Avoid uploading sensitive material to public analysis sites or public chat tools without company approval."
   }
  ],
  "scenario": {
   "subject": "Share payroll list for audit",
   "sender": "External reviewer <audit@review-files.example.invalid>",
   "message": "Upload the full payroll list using this public folder. Set access to anyone with the link so our whole team has access.",
   "flags": [
    "Sensitive staff data requested",
    "Public sharing requested",
    "Reviewer and purpose not verified"
   ],
   "action": "Confirm the request with your authorized audit contact. Use approved restricted sharing only after approval."
  },
  "checklist": [
   "Verify the document owner and purpose",
   "Use your known work application",
   "Limit sharing to approved recipients",
   "Describe incidents without exposing confidential contents"
  ],
  "questions": [
   {
    "prompt": "A sharing notice uses a familiar service logo. What still needs checking?",
    "options": [
     "Nothing",
     "The sender, document, and purpose",
     "Only the font"
    ],
    "answer": 1,
    "explanation": "The invitation still requires context."
   },
   {
    "prompt": "An external person requests your payroll list. What comes first?",
    "options": [
     "Upload publicly",
     "Send before the deadline",
     "Confirm identity, purpose, and approval"
    ],
    "answer": 2,
    "explanation": "Sensitive data requires an authorized purpose."
   },
   {
    "prompt": "Which setting suits confidential work documents?",
    "options": [
     "Approved restricted access",
     "Anyone with the link",
     "A public social post"
    ],
    "answer": 0,
    "explanation": "Limit access according to company policy."
   },
   {
    "prompt": "A complaint about a file should include what?",
    "options": [
     "Full confidential contents",
     "A description without secrets or confidential attachments",
     "All account recovery codes"
    ],
    "answer": 1,
    "explanation": "Support does not need account secrets."
   },
   {
    "prompt": "Where should you check an unexpected shared document?",
    "options": [
     "A new login page in the email",
     "A random file mirror",
     "Your known work application"
    ],
    "answer": 2,
    "explanation": "Use the established work service."
   }
  ],
  "resources": [
   {
    "label": "Google: avoid and report phishing",
    "url": "https://support.google.com/mail/answer/8253?hl=en"
   }
  ]
 },
 {
  "id": "protection",
  "title": "Use PhishAware results and reporting",
  "category": "Platform practice",
  "minutes": 6,
  "description": "Understand risk labels, notifications, reports, and the limits of email scanning.",
  "objectives": [
   "Interpret Low, Medium, and High risk",
   "Separate review from reporting",
   "Find read notifications and request help"
  ],
  "sections": [
   {
    "title": "Treat labels as guidance",
    "text": "PhishAware checks message content for risk indicators. Low risk is not proof of safety. Medium risk calls for verification. High risk deserves prompt attention. The current scanner does not verify linked websites, sender authentication, or attachment contents, so follow your company's process as well."
   },
   {
    "title": "Choose the action for your decision",
    "text": "Save as reviewed records your review. Report suspicious shares the finding summary with administrators. Mark as read acknowledges a notification and moves the notification out of Active. None of these actions proves the email safe or automatically removes an email from Gmail."
   },
   {
    "title": "Find help and previous notifications",
    "text": "Use Notifications → History to search read warnings. Use Settings → Contact and feedback for complaints or help requests and select company administrators or platform owners. For an urgent incident, also use your company's direct security contact. Email alert delivery depends on the configured sender and provider."
   }
  ],
  "scenario": {
   "subject": "A finding shows Low risk",
   "sender": "PhishAware practice example",
   "message": "A Low risk email still asks Ama to move a confidential customer file to an unfamiliar service. She is unsure whether the request is authorized.",
   "flags": [
    "Unfamiliar destination",
    "Confidential information requested",
    "Risk label is being treated as authorization"
   ],
   "action": "Pause and verify the request. Report suspicious if concerns persist, regardless of the Low risk label."
  },
  "checklist": [
   "Read reasons and suggested actions",
   "Verify even when a result is Low risk",
   "Use Report suspicious for incident escalation",
   "Use History to find read warnings"
  ],
  "questions": [
   {
    "prompt": "Does Low risk establish the email is safe?",
    "options": [
     "Yes",
     "No",
     "Only if saved as reviewed"
    ],
    "answer": 1,
    "explanation": "The label is a content estimate, not proof of safety."
   },
   {
    "prompt": "Which action shares a finding with administrators?",
    "options": [
     "Mark as read",
     "Save as reviewed",
     "Report suspicious"
    ],
    "answer": 2,
    "explanation": "Report suspicious is the escalation action."
   },
   {
    "prompt": "Where do read email notifications go?",
    "options": [
     "History",
     "The Gmail trash folder",
     "They are deleted permanently"
    ],
    "answer": 0,
    "explanation": "Read warnings remain searchable until mailbox disconnection."
   },
   {
    "prompt": "Does the scanner inspect attachment contents?",
    "options": [
     "Yes, every file",
     "No, the current scanner does not",
     "Only after Mark as read"
    ],
    "answer": 1,
    "explanation": "Use approved checks for attachments."
   },
   {
    "prompt": "An urgent incident needs attention while email delivery is delayed. Your response?",
    "options": [
     "Wait silently",
     "Mark as read only",
     "Use reporting and your direct company security contact"
    ],
    "answer": 2,
    "explanation": "Use established urgent contact procedures."
   }
  ],
  "resources": [
   {
    "label": "Google: avoid and report phishing",
    "url": "https://support.google.com/mail/answer/8253?hl=en"
   }
  ]
 }
];
export function gradeTraining(moduleId:string,answers:unknown):number{const lesson=modules.find(m=>m.id===moduleId);if(!lesson||!Array.isArray(answers)||answers.length!==lesson.questions.length||answers.some((a,i)=>!Number.isInteger(a)||a<0||a>=lesson.questions[i].options.length))throw Error('Complete all quiz answers');return Math.round(lesson.questions.filter((q,i)=>q.answer===answers[i]).length/lesson.questions.length*100);}
export function trainingNotes(lesson:TrainingModule):string{return [lesson.title,lesson.description,'Learning goals',...lesson.objectives,...lesson.sections.flatMap(s=>['',s.title,s.text]),'','Practice scenario',lesson.scenario.subject,lesson.scenario.sender,lesson.scenario.message,'Warning signs',...lesson.scenario.flags,'Suggested response',lesson.scenario.action,'','Your checklist',...lesson.checklist,'','Further reading',...lesson.resources.map(r=>r.label+': '+r.url)].join('\n');}
export const uid=()=>globalThis.crypto?.randomUUID?.()??Math.random().toString(36).slice(2)+Date.now().toString(36);
export const now=()=>new Date().toISOString();
export function emptyWorkspace():Workspace{return {version:1,organization:'Your organization',employees:[],campaigns:[],deliveries:[],completions:[],events:[],notices:[],sampleData:false};}
export function sampleWorkspace():Workspace{
 const w=emptyWorkspace();w.organization='Demo organization';w.sampleData=true;
 const names=[['Ama Mensah','Finance'],['Kofi Asante','Engineering'],['Abena Owusu','People Operations'],['Kwame Boateng','Operations'],['Akosua Addo','Finance'],['Yaw Osei','Engineering'],['Esi Arthur','Operations'],['Kojo Appiah','People Operations']];
 w.employees=names.map(([name,department],i)=>({id:'employee-'+i,name,email:name.toLowerCase().replace(' ','.')+'@demo.example.invalid',department,active:true,joined:'2026-09-01T09:00:00Z'}));
 for(let i=0;i<2;i++){const t=templates[i];const c:Campaign={id:'campaign-'+i,name:i?'Supplier payment verification':'September password awareness',templateId:t.id,subject:t.subject,sender:t.sender,body:t.body,department:'All departments',status:i?'Active':'Completed',created:`2026-09-${i?'24':'10'}T09:00:00Z`,launched:`2026-09-${i?'25':'12'}T09:00:00Z`,due:i?'2026-10-07':'2026-09-19'};w.campaigns.push(c);w.employees.forEach((e,j)=>w.deliveries.push({id:`delivery-${i}-${j}`,campaignId:c.id,employeeId:e.id,opened:i?j<5:true,clicked:i?j===3:j<3,reported:i?j===0:j>=3,created:c.launched!}));}
 w.employees.forEach((e,i)=>modules.slice(0,i<4?3:1).forEach(m=>w.completions.push({employeeId:e.id,moduleId:m.id,score:100,attempts:1,date:'2026-09-26T10:00:00Z'})));
 w.events=[{id:'event-1',actor:'Demo administrator',action:'Launched Supplier payment verification for 8 employees',type:'Campaign',date:'2026-09-25T09:00:00Z'},{id:'event-2',actor:'Ama Mensah',action:'Reported a suspicious simulation message',type:'Simulation',date:'2026-09-26T11:30:00Z'},{id:'event-3',actor:'Kofi Asante',action:'Completed Report and respond',type:'Training',date:'2026-09-26T10:00:00Z'}];
 w.notices=w.employees.map(e=>({id:'notice-'+e.id,employeeId:e.id,text:'A new simulation message is available in your training inbox.',read:false,date:'2026-09-25T09:00:00Z'}));return w;
}
export function percent(value:number,total:number){return total?Math.round(value/total*100):0;}
export function results(w:Workspace,employeeId?:string){const ds=w.deliveries.filter(d=>!employeeId||d.employeeId===employeeId);return {total:ds.length,opened:ds.filter(d=>d.opened).length,clicked:ds.filter(d=>d.clicked).length,reported:ds.filter(d=>d.reported).length,clickRate:percent(ds.filter(d=>d.clicked).length,ds.length),reportRate:percent(ds.filter(d=>d.reported).length,ds.length)};}
export function completionRate(w:Workspace,employeeId?:string){const people=w.employees.filter(e=>e.active&&(!employeeId||e.id===employeeId));return percent(new Set(w.completions.filter(c=>c.score>=80&&people.some(e=>e.id===c.employeeId)&&modules.some(m=>m.id===c.moduleId)).map(c=>c.employeeId+':'+c.moduleId)).size,people.length*modules.length);}
export function log(w:Workspace,actor:string,action:string,type:Event['type']){w.events.unshift({id:uid(),actor,action,type,date:now()});}
export function launchCampaign(w:Workspace,id:string,actor:string):number{
 const c=w.campaigns.find(c=>c.id===id);if(!c||c.status!=='Draft')throw Error('Only draft campaigns are available to launch.');
 const people=w.employees.filter(e=>e.active&&(c.department==='All departments'||c.department===e.department));if(!people.length)throw Error('No active employees match this department.');
 c.status='Active';c.launched=now();for(const e of people){w.deliveries.push({id:uid(),campaignId:id,employeeId:e.id,opened:false,clicked:false,reported:false,created:now()});w.notices.unshift({id:uid(),employeeId:e.id,text:`New simulation: ${c.name}`,read:false,date:now()});}log(w,actor,`Launched ${c.name} for ${people.length} employees`,'Campaign');return people.length;
}
export function recordResponse(w:Workspace,id:string,employeeId:string,action:'opened'|'clicked'|'reported'){
 const d=w.deliveries.find(d=>d.id===id&&d.employeeId===employeeId);if(!d)throw Error('This simulation message is unavailable.');
 const c=w.campaigns.find(c=>c.id===d.campaignId);if(c?.status!=='Active')throw Error('This campaign has ended. Results are read-only.');
 if(d[action])return;d[action]=true;if(action==='clicked'||action==='reported')d.opened=true;
 const e=w.employees.find(e=>e.id===employeeId)!;log(w,e.name,`${action==='reported'?'Reported':action==='clicked'?'Followed a training link in':'Opened'} ${c.name}`,'Simulation');
 if(action==='clicked')w.notices.unshift({id:uid(),employeeId,text:'Review Spot the warning signs after your recent simulation response.',read:false,date:now()});
}
export function csvCell(v:unknown){let s=String(v??'');if(/^[=+@\-\t\r]/.test(s))s="'"+s;return '"'+s.replaceAll('"','""')+'"';}
export function reportCSV(w:Workspace){const header=['Employee','Email','Department','Messages','Opened','Clicked','Reported','Click rate (%)','Training completed (%)'];return [header,...w.employees.map(e=>{const r=results(w,e.id);return [e.name,e.email,e.department,r.total,r.opened,r.clicked,r.reported,r.clickRate,completionRate(w,e.id)];})].map(row=>row.map(csvCell).join(',')).join('\r\n');}
