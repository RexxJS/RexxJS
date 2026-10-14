/**
 * Deployment System Handlers Index
 * Exports all deployment system-level handlers for enhanced infrastructure as code
 * 
 * Copyright (c) 2025 Paul Hammant
 * Licensed under the MIT License
 */

const RemoteShellHandler = require('./remote-shell-handler');
// The container handlers: podman-address's and docker-address's (they
// moved there in 320a693)
const { AddressPodmanHandler: PodmanHandler } = require('../../podman-address/podman-address.js');
const { AddressDockerHandler: DockerHandler } = require('../../docker-address/docker-address.js');
const DeploymentOrchestrator = require('./deployment-orchestrator');

module.exports = {
  RemoteShellHandler,
  PodmanHandler,
  DockerHandler,
  DeploymentOrchestrator,
  
  // Factory functions for easy integration
  createRemoteShellHandler: (config = {}) => {
    const handler = new RemoteShellHandler();
    return handler.initialize(config).then(() => handler);
  },
  
  createPodmanHandler: (config = {}) => {
    const handler = new PodmanHandler();
    return handler.initialize(config).then(() => handler);
  },
  
  createDockerHandler: (config = {}) => {
    const handler = new DockerHandler();
    return handler.initialize(config).then(() => handler);
  },
  
  createDeploymentOrchestrator: (config = {}) => {
    const handler = new DeploymentOrchestrator();
    return handler.initialize(config).then(() => handler);
  },
  
  // Register all system handlers with interpreter
  registerSystemHandlers: async (interpreter, config = {}) => {
    const handlers = {};
    
    // Remote shell handler
    if (config.enableRemoteShell !== false) {
      handlers.remote_shell = await module.exports.createRemoteShellHandler(config.remoteShell);
    }
    
    // Container handlers (user can choose podman, docker, or both)
    if (config.enablePodman !== false) {
      handlers.podman = await module.exports.createPodmanHandler(config.podman);
    }
    
    if (config.enableDocker !== false) {
      handlers.docker = await module.exports.createDockerHandler(config.docker);
    }
    
    // Deployment orchestrator
    if (config.enableDeployment !== false) {
      handlers.deployment = await module.exports.createDeploymentOrchestrator(config.deployment);
    }
    
    // Register with interpreter
    for (const [name, handler] of Object.entries(handlers)) {
      interpreter.registerAddressHandler(name, handler);
    }
    
    return handlers;
  }
};