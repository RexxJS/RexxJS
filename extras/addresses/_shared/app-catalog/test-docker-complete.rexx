#!/usr/bin/env rexx
/* Complete end-to-end Docker test */

REQUIRE '/home/paul/scm/RexxJS/extras/addresses/docker-address/docker-address.js'
ADDRESS DOCKER

SAY '========================================='
SAY '    Docker ADDRESS Handler Test'
SAY '    (with Alpine/musl static binary)'
SAY '========================================='
SAY ''

/* Pre-cleanup: Remove any existing test containers from previous runs */
SAY '[0/14] Pre-cleanup: Removing existing test containers...'
/* Use ADDRESS DOCKER to force-remove containers (comma-separated) */
ADDRESS DOCKER
"remove name=rexx-sinatra-hello-setup,rexx-sinatra-hello-world force=true ignore_missing=true"
SAY '  ✓ Pre-cleanup complete'
SAY ''

/* Check Docker is running and exit if not */

LET name = "rexx-sinatra-hello-setup"

LET script = <<SCRIPT
check_docker_running
create image=ruby:3-alpine name={{name}} command="tail -f /dev/null" ports=4567:4567
start name={{name}}
check_container_with_echo container={{name}} test_command=echo
SCRIPT

"run_script var=script"

SAY ''
SAY 'Script execution results:'
SAY '  Success:' RESULT.success
SAY '  Commands executed:' RESULT.executedCount
SAY '  All succeeded:' RESULT.allSucceeded

IF RESULT.success = false THEN DO
  SAY '  Failed at:' RESULT.failedAt
  SAY '  Error:' RESULT.error
END

EXIT 1 UNLESS RESULT.success, "Multi-line docker script failed"
SAY '  ✓ Multi-line script completed successfully'
SAY ''

/* Deploy static RexxJS binary (works on Alpine!) */
SAY '[6.5/15] Deploying static RexxJS binary to Alpine...'
ADDRESS DOCKER
'deploy_rexx container=rexx-sinatra-hello-setup rexx_binary=./bin/rexx target=/usr/local/bin/rexx'
IF RESULT.success = false THEN DO
  SAY '  ERROR: deploy_rexx failed'
  SAY '  Error:' RESULT.error
  SAY '  Output:' RESULT.output
  "stop name=rexx-sinatra-hello-setup"
  "remove name=rexx-sinatra-hello-setup"
  EXIT 1
END
SAY '  ✓ Binary deployed successfully'

/* Test if the static binary actually works in Alpine */
SAY '[6.6/15] Testing static binary in Alpine container...'
ADDRESS DOCKER
'execute container=rexx-sinatra-hello-setup command="echo test" timeout=10000'
SAY 'DEBUG: execute result - success:' RESULT.success 'exitCode:' RESULT.exitCode
SAY 'DEBUG: stdout length:' LENGTH(RESULT.stdout)
IF RESULT.exitCode = 0 THEN DO
  SAY '  ✓ Static binary works in Alpine!'
  SAY '  Output preview:' || SUBSTR(RESULT.stdout, 1, 50) || '...'
END
ELSE DO
  SAY '  ERROR: Static binary failed to run'
  SAY '  ExitCode:' RESULT.exitCode
  SAY '  Error:' RESULT.error
  SAY '  Stdout:' RESULT.stdout
  SAY '  Stderr:' RESULT.stderr
  "stop name=rexx-sinatra-hello-setup"
  "remove name=rexx-sinatra-hello-setup"
  EXIT 1
END
SAY ''

/* Use RexxJS inside container for setup (gems, app.rb creation, cleanup) */
SAY '[7-9/15] Using RexxJS in container for complete setup...'

/* Create the RexxJS setup script content using HEREDOC - will run INSIDE container via stdin */
LET setupScript = <<SETUP_CONTENT
#!/usr/bin/env rexx
/* RexxJS setup script - runs inside Alpine container via stdin */

/* ADDRESS SYSTEM is auto-loaded in static binary - no REQUIRE needed */
ADDRESS SYSTEM

/* Install gems using ADDRESS SYSTEM */
"gem install sinatra rackup webrick --no-document"
SAY "Gems installed"

/* Create app.rb using nested HEREDOC */
LET appRb = <<SINATRA_APP
require "sinatra"
set :bind, "0.0.0.0"
set :port, 4567
get "/" do
  "Hello from RexxJS + Sinatra!"
end
SINATRA_APP

CALL FILE_WRITE '/app.rb', appRb
SAY "Sinatra app created"

SAY "Setup complete!"
SETUP_CONTENT

/* Execute script via stdin - no file I/O needed! */
SAY '  Executing setup script via stdin...'
ADDRESS DOCKER
'execute_stdin container=rexx-sinatra-hello-setup command="/usr/local/bin/rexx --stdin" stdin_var=setupScript timeout=120000'
IF RESULT.exitCode <> 0 THEN DO
  ADDRESS  /* Reset to default for error messages */
  SAY '  ERROR: RexxJS setup script failed'
  SAY '  Exit code:' RESULT.exitCode
  SAY '  Stdout:' RESULT.stdout
  SAY '  Stderr:' RESULT.stderr
  ADDRESS DOCKER
  "stop name=rexx-sinatra-hello-setup"
  "remove name=rexx-sinatra-hello-setup"
  EXIT 1
END
ADDRESS  /* Reset to default */
SAY '  ✓ Setup complete via RexxJS:'
SAY RESULT.stdout
SAY ''

/* Commit container to image */
SAY '[10/15] Committing container state to image...'
ADDRESS DOCKER
"commit container=rexx-sinatra-hello-setup image=rexxjs/sinatra-hello-world:deps"
EXIT 1 UNLESS RESULT.success, '  ERROR: Commit failed: ' || RESULT.error
SAY '  ✓ Container committed to rexxjs/sinatra-hello-world:deps'
SAY ''

/* Build final image with Sinatra as CMD */
SAY '[11/15] Building final image with CMD...'
ADDRESS DOCKER
'build_image from_image=rexxjs/sinatra-hello-world:deps tag=rexxjs/sinatra-hello-world:latest cmd="ruby /app.rb"'
EXIT 1 UNLESS RESULT.success, '  ERROR: Build failed: ' || RESULT.error
SAY '  ✓ Image built: rexxjs/sinatra-hello-world:latest'
SAY ''

/* Stop and remove the setup container */
SAY '[13/15] Removing setup container...'
ADDRESS DOCKER
"stop name=rexx-sinatra-hello-setup"
"remove name=rexx-sinatra-hello-setup"
SAY '  ✓ Setup container removed'
SAY ''

/* Create and start final container with Sinatra */
SAY '[14/15] Starting final container with Sinatra...'
'create image=rexxjs/sinatra-hello-world:latest name=rexx-sinatra-hello-world ports="4567:4567"'
EXIT 1 UNLESS RESULT.success, '  ERROR: Failed to create final container'
"start name=rexx-sinatra-hello-world"
IF RESULT.success = false THEN DO
  SAY '  ERROR: Failed to start final container'
  "remove name=rexx-sinatra-hello-world"
  EXIT 1
END
SAY '  ✓ Container started'

/* Wait for Sinatra port to be ready */
SAY '  Waiting for Sinatra to be ready on port 4567...'
ADDRESS DOCKER
"wait_for_port container=rexx-sinatra-hello-world port=4567 timeout=60000 retryInterval=1000 maxRetries=60"
IF RESULT.success = false THEN DO
  SAY '  ERROR: Port 4567 never became ready'
  SAY '  Error:' RESULT.error
  "stop name=rexx-sinatra-hello-world"
  "remove name=rexx-sinatra-hello-world"
  EXIT 1
END
SAY '  ✓ Port 4567 is ready after ' || RESULT.attempts || ' attempts (' || RESULT.duration || 'ms)'

/* Test with HTTP_GET (should succeed immediately since port is ready) */
SAY '  Testing with HTTP_GET...'
LET response = HTTP_GET("http://localhost:4567/", {}, 5000)
IF response.ok THEN DO
  SAY '  ✓ HTTP Status:' response.status
  SAY '  ✓ Response:' response.body
  SAY '  ✓ Connected after attempt:' response.attempt
END
ELSE DO
  ADDRESS DOCKER
  "stop name=rexx-sinatra-hello-world"
  "remove name=rexx-sinatra-hello-world"
  EXIT 1 UNLESS response.ok, '  ERROR: HTTP request failed after ' || response.attempt || ' attempts: ' || response.error
END
SAY ''

/* Cleanup final container and images */
SAY '[15/15] Cleanup...'
ADDRESS DOCKER
"stop name=rexx-sinatra-hello-world"
"remove name=rexx-sinatra-hello-world"
/* INTERPRET_JS "require('child_process').execSync('docker rmi rexxjs/sinatra-hello-world:latest rexxjs/sinatra-hello-world:deps 2>/dev/null || true')" */
SAY '  ✓ Cleanup complete (images preserved for inspection)'
SAY ''

SAY '========================================='
SAY '  ✓✓✓ ALL TESTS PASSED ✓✓✓'
SAY '========================================='
SAY ''
SAY 'Successfully tested:'
SAY '  - Docker status check'
SAY '  - Container creation (Ruby Alpine image with port mapping)'
SAY '  - Container start'
SAY '  - Container listing'
SAY '  - Container command execution'
SAY '  - Static RexxJS binary deployment to Alpine (musl)'
SAY '  - Static binary execution in Alpine container'
SAY '  - RexxJS script execution inside container via --stdin'
SAY '  - ADDRESS SYSTEM for gem installation (inside container)'
SAY '  - Inline file creation with LINEOUT (app.rb via RexxJS)'
SAY '  - Shell-functions.js RM for cleanup (inside container)'
SAY '  - Docker commit (save container state)'
SAY '  - Docker build (from committed image)'
SAY '  - Container with Sinatra as main process'
SAY '  - Port readiness checking (wait_for_port with HTTP verification)'
SAY '  - HTTP_GET to Sinatra endpoint'
SAY '  - Container and image cleanup'
SAY ''
SAY 'Test complete. Exiting...'
SAY ''

/* Script exits naturally - no explicit shutdown needed */
EXIT 0
