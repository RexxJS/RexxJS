const NspawnPostConfigHandler = require('../src/nspawn-post-config');

describe('systemd-nspawn Post-Configuration Handler - Simple Tests', () => {
  let nspawnPostConfig;

  beforeEach(() => {
    // Create new handler instance
    nspawnPostConfig = new NspawnPostConfigHandler();
    
    // Mock the nspawnHandler dependency
    nspawnPostConfig.nspawnHandler = {
      startMachine: jest.fn().mockResolvedValue({ success: true }),
      execInMachine: jest.fn().mockResolvedValue({ success: true, output: '' })
    };
  });

  describe('Base System Setup', () => {
    test('should setup base system packages', async () => {
      const result = await nspawnPostConfig.setupBaseSystem({
        name: 'web01',
        distro: 'ubuntu'
      }, {});

      expect(nspawnPostConfig.nspawnHandler.startMachine).toHaveBeenCalledWith({ name: 'web01' }, {});
      expect(nspawnPostConfig.nspawnHandler.execInMachine).toHaveBeenCalledWith(
        { name: 'web01', command: 'apt update', timeout: 30000 }, {}
      );

      expect(result).toEqual({
        success: true,
        name: 'web01',
        distro: 'ubuntu',
        locale: 'en_US.UTF-8',
        timezone: 'UTC',
        packagesInstalled: ['curl', 'wget', 'vim', 'nano', 'htop', 'ca-certificates', 'gnupg', 'lsb-release'],
        message: 'Base system setup completed for machine web01'
      });
    });

    test('should handle Fedora package manager', async () => {
      const result = await nspawnPostConfig.setupBaseSystem({
        name: 'fed01',
        distro: 'fedora'
      }, {});

      expect(nspawnPostConfig.nspawnHandler.execInMachine).toHaveBeenCalledWith(
        { name: 'fed01', command: 'dnf update -y', timeout: 30000 }, {}
      );

      expect(result).toEqual({
        success: true,
        name: 'fed01',
        distro: 'fedora',
        locale: 'en_US.UTF-8',
        timezone: 'UTC',
        packagesInstalled: ['curl', 'wget', 'vim', 'nano', 'htop', 'ca-certificates', 'gnupg', 'lsb-release'],
        message: 'Base system setup completed for machine fed01'
      });
    });
  });

  describe('Development Environment Setup', () => {
    test('should install Node.js development environment', async () => {
      nspawnPostConfig.detectDistro = jest.fn().mockResolvedValue('ubuntu');

      const result = await nspawnPostConfig.setupDevelopmentEnvironment({
        name: 'web01',
        environment: 'nodejs',
        version: '20'
      }, {});

      expect(result).toEqual({
        success: true,
        name: 'web01',
        environment: 'nodejs',
        tools: ['node', 'npm', 'yarn', 'pm2'],
        version: '20',
        message: 'Node.js development environment setup completed for machine web01'
      });
    });

    test('should install Python development environment', async () => {
      nspawnPostConfig.detectDistro = jest.fn().mockResolvedValue('ubuntu');

      const result = await nspawnPostConfig.setupDevelopmentEnvironment({
        name: 'py01',
        environment: 'python',
        version: '3.11'
      }, {});

      expect(result).toEqual({
        success: true,
        name: 'py01',
        environment: 'python',
        tools: ['python3', 'pip3', 'virtualenv', 'pipenv', 'poetry'],
        version: '3.11',
        message: 'Python development environment setup completed for machine py01'
      });
    });
  });

  describe('SSH Configuration', () => {
    test('should configure SSH access with public key', async () => {
      nspawnPostConfig.detectDistro = jest.fn().mockResolvedValue('ubuntu');

      const result = await nspawnPostConfig.configureSsh({
        name: 'web01',
        username: 'deploy',
        publicKey: 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABgQC...',
        allowRootLogin: 'false'
      }, {});

      expect(result).toEqual({
        success: true,
        name: 'web01',
        username: 'deploy',
        keyConfigured: true,
        allowRootLogin: false,
        port: 22,
        message: 'SSH configured for machine web01'
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle package installation failures', async () => {
      nspawnPostConfig.nspawnHandler.startMachine.mockRejectedValue(
        new Error('No machine \'nonexistent\' known')
      );

      try {
        await nspawnPostConfig.setupBaseSystem({
          name: 'nonexistent',
          distro: 'ubuntu'
        }, {});

        // Should not reach this point
        expect(true).toBe(false);
      } catch (error) {
        expect(error.message).toBe('Base system setup failed: No machine \'nonexistent\' known');
      }
    });
  });
});