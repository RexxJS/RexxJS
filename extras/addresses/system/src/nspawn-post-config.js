/**
 * systemd-nspawn Post-Configuration Handler
 * Post-instantiation configuration and software installation for nspawn containers
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { interpolateMessage, logActivity } = require('../../../../core/src/address-handler-utils');

// Helper function for logging
function log(operation, details) {
  logActivity('NSPAWN_CONFIG', operation, details);
}

class NspawnPostConfigHandler {
  constructor() {
    this.nspawnHandler = null; // Will be injected or created
    this.packageManagers = {
      'debian': 'apt',
      'ubuntu': 'apt', 
      'fedora': 'dnf',
      'centos': 'yum',
      'rhel': 'yum',
      'arch': 'pacman',
      'opensuse': 'zypper',
      'alpine': 'apk'
    };
    this.configTemplates = new Map();
    this.configTemplatesPath = path.join(__dirname, 'templates');
  }

  async initialize(config = {}) {
    this.nspawnHandler = config.nspawnHandler;
    await this.loadConfigTemplates();
    
    log('initialize', { 
      templatesLoaded: this.configTemplates.size,
      packageManagers: Object.keys(this.packageManagers).length
    });
  }

  async handleMessage(message, context) {
    const interpolatedMessage = interpolateMessage(message, context);
    log('handle_message', { message: interpolatedMessage });

    try {
      const { command, params } = this.parseCommand(interpolatedMessage);
      
      switch (command) {
        case 'setupBaseSystem':
        case 'setup_base':
          return await this.setupBaseSystem(params, context);
        case 'installPackages':
        case 'install':
          return await this.installPackages(params, context);
        case 'configureSsh':
        case 'setup_ssh':
          return await this.configureSsh(params, context);
        case 'setupDevelopmentEnvironment':
        case 'setup_dev':
          return await this.setupDevelopmentEnvironment(params, context);
        case 'configureFirewall':
        case 'setup_firewall':
          return await this.configureFirewall(params, context);
        case 'setupMonitoring':
        case 'setup_monitoring':
          return await this.setupMonitoring(params, context);
        case 'configureNetworking':
        case 'setup_network':
          return await this.configureNetworking(params, context);
        case 'setupSystemdServices':
        case 'setup_services':
          return await this.setupSystemdServices(params, context);
        case 'configureUsers':
        case 'setup_users':
          return await this.configureUsers(params, context);
        case 'deployApplication':
        case 'deploy_app':
          return await this.deployApplication(params, context);
        default:
          throw new Error(`Unknown command: ${command}`);
      }
    } catch (error) {
      log('error', { error: error.message, command: message });
      throw error;
    }
  }

  parseCommand(message) {
    const parts = message.trim().split(/\s+/);
    const command = parts[0] || '';
    
    const params = {};
    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      if (part.includes('=')) {
        const [key, ...valueParts] = part.split('=');
        params[key] = valueParts.join('=').replace(/^["']|["']$/g, ''); // Remove quotes
      }
    }
    
    return { command, params };
  }

  async setupBaseSystem(params, context) {
    const { name, distro = 'ubuntu', locale = 'en_US.UTF-8', timezone = 'UTC' } = params;
    
    if (!name) {
      throw new Error('Missing required parameter: name');
    }

    log('setup_base_start', { name, distro, locale, timezone });

    try {
      // Ensure machine is running
      await this.nspawnHandler.startMachine({ name }, context);

      const packageManager = this.packageManagers[distro] || 'apt';
      
      // Update package lists
      await this.execInMachine(name, this.getUpdateCommand(packageManager));

      // Install essential packages
      const essentialPackages = [
        'curl', 'wget', 'vim', 'nano', 'htop', 'ca-certificates', 'gnupg', 'lsb-release'
      ];
      
      await this.installPackagesInMachine(name, essentialPackages, packageManager);

      // Configure locale and timezone
      if (packageManager === 'apt') {
        await this.execInMachine(name, `locale-gen ${locale}`);
        await this.execInMachine(name, `update-locale LANG=${locale}`);
        await this.execInMachine(name, `timedatectl set-timezone ${timezone}`);
      } else if (packageManager === 'dnf' || packageManager === 'yum') {
        await this.execInMachine(name, `localectl set-locale LANG=${locale}`);
        await this.execInMachine(name, `timedatectl set-timezone ${timezone}`);
      }

      log('setup_base_success', { name, distro, packagesInstalled: essentialPackages.length });

      return {
        success: true,
        name,
        distro,
        locale,
        timezone,
        packagesInstalled: essentialPackages,
        message: `Base system setup completed for machine ${name}`
      };

    } catch (error) {
      log('setup_base_error', { name, error: error.message });
      throw new Error(`Base system setup failed: ${error.message}`);
    }
  }

  async installPackages(params, context) {
    const { name, packages, distro = 'ubuntu', update = 'true' } = params;
    
    if (!name || !packages) {
      throw new Error('Missing required parameters: name, packages');
    }

    const packageList = Array.isArray(packages) ? packages : packages.split(',');
    const packageManager = this.packageManagers[distro] || 'apt';

    log('install_packages_start', { name, packages: packageList, packageManager });

    try {
      if (update === 'true') {
        await this.execInMachine(name, this.getUpdateCommand(packageManager));
      }

      await this.installPackagesInMachine(name, packageList, packageManager);

      return {
        success: true,
        name,
        packagesInstalled: packageList,
        packageManager,
        message: `Packages installed in machine ${name}`
      };

    } catch (error) {
      log('install_packages_error', { name, error: error.message });
      throw new Error(`Package installation failed: ${error.message}`);
    }
  }

  async configureSsh(params, context) {
    const { name, username = 'admin', publicKey, allowRootLogin = 'false', port = '22' } = params;
    
    if (!name) {
      throw new Error('Missing required parameter: name');
    }

    log('configure_ssh_start', { name, username, allowRootLogin, port });

    try {
      // Install OpenSSH server
      const distro = await this.detectDistro(name);
      const packageManager = this.packageManagers[distro] || 'apt';
      
      if (packageManager === 'apt') {
        await this.installPackagesInMachine(name, ['openssh-server'], packageManager);
      } else if (packageManager === 'dnf' || packageManager === 'yum') {
        await this.installPackagesInMachine(name, ['openssh-server'], packageManager);
      } else if (packageManager === 'pacman') {
        await this.installPackagesInMachine(name, ['openssh'], packageManager);
      }

      // Create user if not exists
      if (username !== 'root') {
        await this.execInMachine(name, `id ${username} || useradd -m -s /bin/bash ${username}`);
        await this.execInMachine(name, `usermod -aG sudo ${username}` );
      }

      // Configure SSH key
      if (publicKey) {
        const homeDir = username === 'root' ? '/root' : `/home/${username}`;
        await this.execInMachine(name, `mkdir -p ${homeDir}/.ssh`);
        await this.execInMachine(name, `echo "${publicKey}" >> ${homeDir}/.ssh/authorized_keys`);
        await this.execInMachine(name, `chmod 700 ${homeDir}/.ssh`);
        await this.execInMachine(name, `chmod 600 ${homeDir}/.ssh/authorized_keys`);
        await this.execInMachine(name, `chown -R ${username}:${username} ${homeDir}/.ssh`);
      }

      // Configure SSH daemon
      const sshConfig = [
        `Port ${port}`,
        `PermitRootLogin ${allowRootLogin === 'true' ? 'yes' : 'no'}`,
        'PasswordAuthentication no',
        'PubkeyAuthentication yes',
        'X11Forwarding no'
      ].join('\n');

      await this.execInMachine(name, `echo "${sshConfig}" >> /etc/ssh/sshd_config.d/custom.conf`);
      
      // Enable and start SSH service
      await this.execInMachine(name, 'systemctl enable ssh');
      await this.execInMachine(name, 'systemctl start ssh');

      return {
        success: true,
        name,
        username,
        keyConfigured: !!publicKey,
        allowRootLogin: allowRootLogin === 'true',
        port: parseInt(port),
        message: `SSH configured for machine ${name}`
      };

    } catch (error) {
      log('configure_ssh_error', { name, error: error.message });
      throw new Error(`SSH configuration failed: ${error.message}`);
    }
  }

  async setupDevelopmentEnvironment(params, context) {
    const { name, environment, version, distro } = params;
    
    if (!name || !environment) {
      throw new Error('Missing required parameters: name, environment');
    }

    log('setup_dev_environment_start', { name, environment, version });

    try {
      const detectedDistro = distro || await this.detectDistro(name);
      
      switch (environment.toLowerCase()) {
        case 'nodejs':
        case 'node':
          await this.setupNodeJs(name, version || '20', detectedDistro);
          return {
            success: true,
            name,
            environment: 'nodejs',
            tools: ['node', 'npm', 'yarn', 'pm2'],
            version,
            message: `Node.js development environment setup completed for machine ${name}`
          };

        case 'python':
          await this.setupPython(name, version || '3.11', detectedDistro);
          return {
            success: true,
            name,
            environment: 'python',
            tools: ['python3', 'pip3', 'virtualenv', 'pipenv', 'poetry'],
            version,
            message: `Python development environment setup completed for machine ${name}`
          };

        case 'go':
        case 'golang':
          await this.setupGolang(name, version || '1.21.5', detectedDistro);
          return {
            success: true,
            name,
            environment: 'go',
            tools: ['go'],
            version: version || '1.21.5',
            message: `Go development environment setup completed for machine ${name}`
          };

        case 'rust':
          await this.setupRust(name, detectedDistro);
          return {
            success: true,
            name,
            environment: 'rust',
            tools: ['rustc', 'cargo'],
            message: `Rust development environment setup completed for machine ${name}`
          };

        case 'java':
          await this.setupJava(name, version || '17', detectedDistro);
          return {
            success: true,
            name,
            environment: 'java',
            tools: ['java', 'javac', 'maven', 'gradle'],
            version: version || '17',
            message: `Java development environment setup completed for machine ${name}`
          };

        default:
          throw new Error(`Unknown development environment: ${environment}`);
      }

    } catch (error) {
      log('setup_dev_environment_error', { name, environment, error: error.message });
      throw new Error(`Development environment setup failed: ${error.message}`);
    }
  }

  async setupNodeJs(name, version, distro) {
    const packageManager = this.packageManagers[distro] || 'apt';
    
    if (packageManager === 'apt') {
      await this.execInMachine(name, `curl -fsSL https://deb.nodesource.com/setup_${version}.x | bash -`);
      await this.installPackagesInMachine(name, ['nodejs', 'build-essential'], packageManager);
    } else if (packageManager === 'dnf' || packageManager === 'yum') {
      await this.execInMachine(name, `curl -fsSL https://rpm.nodesource.com/setup_${version}.x | bash -`);
      await this.installPackagesInMachine(name, ['nodejs', 'gcc-c++', 'make'], packageManager);
    } else if (packageManager === 'pacman') {
      await this.installPackagesInMachine(name, ['nodejs', 'npm'], packageManager);
    }

    // Install global packages
    await this.execInMachine(name, 'npm install -g yarn pm2');
  }

  async setupPython(name, version, distro) {
    const packageManager = this.packageManagers[distro] || 'apt';
    
    if (packageManager === 'apt') {
      await this.installPackagesInMachine(name, ['python3', 'python3-pip', 'python3-venv', 'python3-dev'], packageManager);
    } else if (packageManager === 'dnf' || packageManager === 'yum') {
      await this.installPackagesInMachine(name, ['python3', 'python3-pip', 'python3-venv', 'python3-devel'], packageManager);
    } else if (packageManager === 'pacman') {
      await this.installPackagesInMachine(name, ['python', 'python-pip', 'python-virtualenv'], packageManager);
    }

    // Install Python tools
    await this.execInMachine(name, 'pip3 install virtualenv pipenv poetry');
  }

  async setupGolang(name, version, distro) {
    // Download and install Go
    await this.execInMachine(name, `wget https://golang.org/dl/go${version}.linux-amd64.tar.gz`);
    await this.execInMachine(name, `tar -C /usr/local -xzf go${version}.linux-amd64.tar.gz`);
    await this.execInMachine(name, `rm go${version}.linux-amd64.tar.gz`);
    
    // Add to PATH
    await this.execInMachine(name, `echo 'export PATH=$PATH:/usr/local/go/bin' >> /etc/profile`);
    await this.execInMachine(name, `echo 'export PATH=$PATH:/usr/local/go/bin' >> ~/.bashrc`);
  }

  async setupRust(name, distro) {
    // Install Rust using rustup
    await this.execInMachine(name, 'curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y');
    await this.execInMachine(name, 'source ~/.cargo/env');
    await this.execInMachine(name, 'echo "source ~/.cargo/env" >> ~/.bashrc');
  }

  async setupJava(name, version, distro) {
    const packageManager = this.packageManagers[distro] || 'apt';
    
    if (packageManager === 'apt') {
      await this.installPackagesInMachine(name, [`openjdk-${version}-jdk`, 'maven', 'gradle'], packageManager);
    } else if (packageManager === 'dnf' || packageManager === 'yum') {
      await this.installPackagesInMachine(name, [`java-${version}-openjdk-devel`, 'maven', 'gradle'], packageManager);
    } else if (packageManager === 'pacman') {
      await this.installPackagesInMachine(name, [`jdk${version}-openjdk`, 'maven', 'gradle'], packageManager);
    }
  }

  async configureFirewall(params, context) {
    const { name, allowedPorts = ['22'], distro, rules = [] } = params;
    
    if (!name) {
      throw new Error('Missing required parameter: name');
    }

    const detectedDistro = distro || await this.detectDistro(name);
    const packageManager = this.packageManagers[detectedDistro] || 'apt';
    const portList = Array.isArray(allowedPorts) ? allowedPorts : allowedPorts.split(',');

    log('configure_firewall_start', { name, allowedPorts: portList });

    try {
      // Install firewall
      if (packageManager === 'apt') {
        await this.installPackagesInMachine(name, ['ufw'], packageManager);
        
        // Configure UFW
        await this.execInMachine(name, 'ufw --force reset');
        for (const port of portList) {
          await this.execInMachine(name, `ufw allow ${port}`);
        }
        
        // Apply custom rules
        for (const rule of rules) {
          await this.execInMachine(name, `ufw ${rule}`);
        }
        
        await this.execInMachine(name, 'ufw --force enable');
        
        return {
          success: true,
          name,
          firewall: 'ufw',
          allowedPorts: portList,
          customRules: rules,
          message: `UFW firewall configured for machine ${name}`
        };
        
      } else if (packageManager === 'dnf' || packageManager === 'yum') {
        await this.execInMachine(name, 'systemctl enable firewalld');
        await this.execInMachine(name, 'systemctl start firewalld');
        
        for (const port of portList) {
          await this.execInMachine(name, `firewall-cmd --permanent --add-port=${port}/tcp`);
        }
        
        await this.execInMachine(name, 'firewall-cmd --reload');
        
        return {
          success: true,
          name,
          firewall: 'firewalld',
          allowedPorts: portList,
          message: `firewalld configured for machine ${name}`
        };
      }

    } catch (error) {
      log('configure_firewall_error', { name, error: error.message });
      throw new Error(`Firewall configuration failed: ${error.message}`);
    }
  }

  async setupMonitoring(params, context) {
    const { name, tools = 'basic', prometheus = 'false', distro } = params;
    
    if (!name) {
      throw new Error('Missing required parameter: name');
    }

    const detectedDistro = distro || await this.detectDistro(name);
    const packageManager = this.packageManagers[detectedDistro] || 'apt';

    log('setup_monitoring_start', { name, tools, prometheus });

    try {
      const basicTools = ['htop', 'iotop', 'nethogs', 'sysstat', 'logrotate'];
      
      await this.installPackagesInMachine(name, basicTools, packageManager);

      const installedTools = [...basicTools];

      if (prometheus === 'true') {
        await this.setupPrometheusExporter(name, packageManager);
        installedTools.push('node-exporter');
      }

      return {
        success: true,
        name,
        tools: installedTools,
        prometheus: prometheus === 'true',
        message: `Monitoring setup completed for machine ${name}`
      };

    } catch (error) {
      log('setup_monitoring_error', { name, error: error.message });
      throw new Error(`Monitoring setup failed: ${error.message}`);
    }
  }

  async setupPrometheusExporter(name, packageManager) {
    if (packageManager === 'apt') {
      await this.installPackagesInMachine(name, ['prometheus-node-exporter'], packageManager);
      await this.execInMachine(name, 'systemctl enable prometheus-node-exporter');
      await this.execInMachine(name, 'systemctl start prometheus-node-exporter');
    } else {
      // Download and install node exporter manually
      await this.execInMachine(name, 'wget https://github.com/prometheus/node_exporter/releases/download/v1.6.1/node_exporter-1.6.1.linux-amd64.tar.gz');
      await this.execInMachine(name, 'tar xvfz node_exporter-1.6.1.linux-amd64.tar.gz');
      await this.execInMachine(name, 'cp node_exporter-1.6.1.linux-amd64/node_exporter /usr/local/bin/');
      
      // Create systemd service
      const serviceContent = `[Unit]
Description=Node Exporter
After=network.target

[Service]
User=nobody
Group=nogroup
Type=simple
ExecStart=/usr/local/bin/node_exporter

[Install]
WantedBy=multi-user.target`;

      await this.execInMachine(name, `echo '${serviceContent}' > /etc/systemd/system/node_exporter.service`);
      await this.execInMachine(name, 'systemctl daemon-reload');
      await this.execInMachine(name, 'systemctl enable node_exporter');
      await this.execInMachine(name, 'systemctl start node_exporter');
    }
  }

  async configureNetworking(params, context) {
    const { name, interfaceName = 'eth0', ip, gateway, dns = ['8.8.8.8', '8.8.4.4'] } = params;
    
    if (!name) {
      throw new Error('Missing required parameter: name');
    }

    log('configure_networking_start', { name, interfaceName, ip, gateway });

    try {
      if (ip) {
        // Static IP configuration
        const netplanConfig = `
network:
  version: 2
  ethernets:
    ${interfaceName}:
      dhcp4: false
      addresses:
        - ${ip}
      gateway4: ${gateway}
      nameservers:
        addresses: [${dns.join(', ')}]
`;

        await this.execInMachine(name, `echo '${netplanConfig}' > /etc/netplan/01-netcfg.yaml`);
        await this.execInMachine(name, 'netplan apply');
      }

      return {
        success: true,
        name,
        interface: interfaceName,
        ip: ip || 'dhcp',
        gateway,
        dns,
        message: `Network configuration completed for machine ${name}`
      };

    } catch (error) {
      log('configure_networking_error', { name, error: error.message });
      throw new Error(`Network configuration failed: ${error.message}`);
    }
  }

  async setupSystemdServices(params, context) {
    const { name, services = [] } = params;
    
    if (!name) {
      throw new Error('Missing required parameter: name');
    }

    log('setup_systemd_services_start', { name, services });

    try {
      const enabledServices = [];
      
      for (const service of services) {
        await this.execInMachine(name, `systemctl enable ${service}`);
        await this.execInMachine(name, `systemctl start ${service}`);
        enabledServices.push(service);
      }

      return {
        success: true,
        name,
        enabledServices,
        message: `Systemd services configured for machine ${name}`
      };

    } catch (error) {
      log('setup_systemd_services_error', { name, error: error.message });
      throw new Error(`Systemd services setup failed: ${error.message}`);
    }
  }

  async detectDistro(name) {
    try {
      const result = await this.execInMachine(name, 'cat /etc/os-release | grep "^ID=" | cut -d"=" -f2 | tr -d "\""');
      return result.output.trim() || 'ubuntu';
    } catch (error) {
      log('detect_distro_error', { name, error: error.message });
      return 'ubuntu'; // Default fallback
    }
  }

  getUpdateCommand(packageManager) {
    switch (packageManager) {
      case 'apt': return 'apt update';
      case 'yum': return 'yum update -y';
      case 'dnf': return 'dnf update -y';
      case 'pacman': return 'pacman -Sy';
      case 'zypper': return 'zypper refresh';
      case 'apk': return 'apk update';
      default: return 'apt update';
    }
  }

  async installPackagesInMachine(name, packages, packageManager) {
    const packageList = packages.join(' ');
    
    switch (packageManager) {
      case 'apt':
        await this.execInMachine(name, `apt install -y ${packageList}`);
        break;
      case 'yum':
        await this.execInMachine(name, `yum install -y ${packageList}`);
        break;
      case 'dnf':
        await this.execInMachine(name, `dnf install -y ${packageList}`);
        break;
      case 'pacman':
        await this.execInMachine(name, `pacman -S --noconfirm ${packageList}`);
        break;
      case 'zypper':
        await this.execInMachine(name, `zypper install -y ${packageList}`);
        break;
      case 'apk':
        await this.execInMachine(name, `apk add ${packageList}`);
        break;
      default:
        await this.execInMachine(name, `apt install -y ${packageList}`);
        break;
    }
  }

  async loadConfigTemplates() {
    try {
      if (fs.existsSync(this.configTemplatesPath)) {
        const files = fs.readdirSync(this.configTemplatesPath);
        
        for (const file of files) {
          if (file.endsWith('.template')) {
            const templateName = path.basename(file, '.template');
            const templatePath = path.join(this.configTemplatesPath, file);
            const templateContent = fs.readFileSync(templatePath, 'utf8');
            
            this.configTemplates.set(templateName, templateContent);
          }
        }
      }

      log('templates_loaded', { count: this.configTemplates.size });
    } catch (error) {
      log('templates_load_error', { error: error.message });
    }
  }

  async execInMachine(name, command, timeout = 30000) {
    return this.nspawnHandler.execInMachine({ name, command, timeout }, {});
  }
}

module.exports = NspawnPostConfigHandler;