# OS Functions for Consideration
## Based on Toybox Command List (200+ commands)

Legend:
- ✅ **Already Implemented**
- 🟢 **High Priority** - Pure JS or Node.js built-ins, zero npm deps
- 🟡 **Medium Priority** - Small, well-maintained npm deps acceptable
- 🔴 **Low Priority** - System-specific, interactive, or not suitable for library
- ❌ **Not Suitable** - Hardware/kernel/interactive features

**Pipeline Suitability:**
- 🟢 **Excellent** - Takes data in, returns data out, perfect for |> pipelines
- 🟡 **Moderate** - Can work in pipelines but limited use cases
- ❌ **Not suitable** - Side effects, interactive, or doesn't fit pipeline model

---

## Implementation File Locations

All 106+ implemented OS functions are located in:

| File | Line Count | Functions |
|------|-----------|-----------|
| `core/src/shell-functions.js` | 3916 | LS, CAT, GREP, FIND, MKDIR, CP, MV, RM, STAT, BASENAME, DIRNAME, HEAD, TAIL, WC, SORT, UNIQ, CUT, PASTE, SEQ, SHUF, TEE, XARGS, NL, REV, TAC, FOLD, EXPAND, DOS2UNIX, UNIX2DOS, FMT, STRINGS, CMP, COMM, CRC32, CKSUM, SUM_BSD, UUENCODE, UUDECODE, BASE32, XXD, HEXDUMP, OD, UNAME, HOSTNAME, WHOAMI, NPROC, ARCH, USERINFO, ENV, UPTIME, GROUPS, LOGNAME, GETCONF, DNSDOMAINNAME, TTY, FACTOR, MCOOKIE, MKTEMP, ASCII, YES, TRUE, FALSE, CAL, WHICH, MKPASSWD, GZIP, GUNZIP, ZCAT, READLINK, DU, RMDIR, TOUCH, CHMOD, LINK, UNLINK, CHOWN, TRUNCATE, LN, CHGRP, INSTALL, KILL, GETPID, GETPPID, EXIT, SLEEP, GETENV, SETENV, UNSETENV, TIMEOUT, FSYNC, SYNC, GETOPT, HOST, IFCONFIG, FILESPLIT |
| `core/src/string-functions.js` | ~2000 | String manipulation functions |
| `core/src/cryptography-functions.js` | ~1000 | HASH_MD5, HASH_SHA1, HASH_SHA256, HASH_SHA384, HASH_SHA512, BASE64_ENCODE, BASE64_DECODE, HASH_BLAKE2B, etc. |
| `core/src/file-functions.js` | 512 | File system helpers |
| `core/src/array-functions.js` | ~1500 | ARRAY_MAP, ARRAY_FILTER, ARRAY_REDUCE, ARRAY_SORT, ARRAY_UNIQUE, ARRAY_JOIN, etc. |
| `core/src/date-time-functions.js` | ~800 | DATE, TIME, NOW, DATE_FORMAT, DATE_PARSE, etc. |
| `core/src/path-functions.js` | ~600 | PATH manipulation utilities |
| `core/src/math-functions.js` | ~1000 | Mathematical functions |
| Other specialized files | Various | JSON, HTTP, URL, regex, validation, etc. functions |

---

## File Operations

| Command | Status | Suitability | Pipeline | Dependencies | Notes |
|---------|--------|-------------|----------|--------------|-------|
| basename | ✅ | Already done | 🟢 | None | PATH_EXTNAME, BASENAME |
| cat | ✅ | Already done | 🟢 | None | CAT |
| cp | ✅ | Already done | ❌ | None | CP - side effects |
| dirname | ✅ | Already done | 🟢 | None | DIRNAME |
| find | ✅ | Already done | 🟢 | None | FIND - returns array |
| ls | ✅ | Already done | 🟢 | None | LS - returns array |
| mkdir | ✅ | Already done | ❌ | None | MKDIR - side effects |
| mv | ✅ | Already done | ❌ | None | MV - side effects |
| rm | ✅ | Already done | ❌ | None | RM - side effects |
| rmdir | ✅ | Already done | ❌ | None | RMDIR - remove directory |
| stat | ✅ | Already done | 🟢 | None | STAT - returns metadata |
| cmp | ✅ | Already done | 🟢 | None | CMP - compare files byte-by-byte |
| comm | ✅ | Already done | 🟢 | None | COMM - set operations on sorted lines |
| du | ✅ | Already done | 🟢 | None | DU - disk usage calculator |
| file | 🟡 | Medium | 🟢 | file-type | MIME type - returns string |
| install | ✅ | Already done | ❌ | None | INSTALL - copy and set permissions |
| link | ✅ | Already done | ❌ | None | LINK - create hard link |
| ln | ✅ | Already done | ❌ | None | LN - create symbolic/hard link |
| readlink | ✅ | Already done | 🟢 | None | READLINK - read symlink target |
| realpath | ✅ | Already done | 🟢 | None | PATH_RESOLVE |
| touch | ✅ | Already done | ❌ | None | TOUCH - update timestamps |
| truncate | ✅ | Already done | ❌ | None | TRUNCATE - truncate file to size |
| unlink | ✅ | Already done | ❌ | None | UNLINK - remove file |
| chgrp | ✅ | Already done | ❌ | None | CHGRP - change group |
| chmod | ✅ | Already done | ❌ | None | CHMOD - change permissions |
| chown | ✅ | Already done | ❌ | None | CHOWN - change owner |
| mkfifo | 🔴 | Low | ❌ | None | Named pipes, niche use |
| mknod | 🔴 | Low | ❌ | None | Device nodes, requires root |

## Text Processing

| Command | Status | Suitability | Pipeline | Dependencies | Notes |
|---------|--------|-------------|----------|--------------|-------|
| grep | ✅ | Already done | 🟢 | None | GREP - returns matches |
| cut | ✅ | Already done | 🟢 | None | CUT - column extraction |
| paste | ✅ | Already done | 🟢 | None | PASTE - merge lines |
| head | ✅ | Already done | 🟢 | None | HEAD - first N lines |
| tail | ✅ | Already done | 🟢 | None | TAIL - last N lines |
| wc | ✅ | Already done | 🟢 | None | WC - word/line/char count |
| sort | ✅ | Already done | 🟢 | None | SORT - sort lines |
| uniq | ✅ | Already done | 🟢 | None | UNIQ - deduplicate |
| tr | ✅ | Already done | 🟢 | None | TRANSLATE - char replacement |
| rev | ✅ | Already done | 🟢 | None | REV - reverse each line |
| tac | ✅ | Already done | 🟢 | None | TAC - reverse line order |
| nl | ✅ | Already done | 🟢 | None | NL - number lines |
| fold | ✅ | Already done | 🟢 | None | FOLD - wrap lines to width |
| fmt | ✅ | Already done | 🟢 | None | FMT - format paragraphs |
| expand | ✅ | Already done | 🟢 | None | EXPAND - tabs to spaces |
| dos2unix | ✅ | Already done | 🟢 | None | DOS2UNIX - line ending conversion |
| unix2dos | ✅ | Already done | 🟢 | None | UNIX2DOS - line ending conversion |
| strings | ✅ | Already done | 🟢 | None | STRINGS - extract printable strings |
| split | ✅ | Already done | 🟡 | None | FILESPLIT - split file into chunks |
| tee | ✅ | Already done | 🟢 | None | TEE - duplicate output |
| sed | ✅ | Already done | 🟢 | sed-lite (@extras) | SED - stream editor (s command) |
| awk | 🔴 | Low | 🟢 | Complex | Full language, use JS instead |
| diff | ✅ | Already done | 🟢 | diff (@extras) | DIFF - text diffing, multiple formats |
| patch | ✅ | Already done | 🟢 | diff (@extras/patch) | PATCH - apply unified diffs |

## Encoding & Hashing

| Command | Status | Suitability | Pipeline | Dependencies | Notes |
|---------|--------|-------------|----------|--------------|-------|
| base32 | ✅ | Already done | 🟢 | None | BASE32 - encode/decode |
| base64 | ✅ | Already done | 🟢 | None | BASE64_ENCODE/BASE64_DECODE |
| uudecode | ✅ | Already done | 🟢 | None | UUDECODE - classic Unix decode |
| uuencode | ✅ | Already done | 🟢 | None | UUENCODE - classic Unix encode |
| md5sum | ✅ | Already done | 🟢 | None | HASH_MD5 - excellent for pipes |
| sha1sum | ✅ | Already done | 🟢 | None | HASH_SHA1 - excellent for pipes |
| sha224sum | 🔴 | Low | 🟢 | None | Niche, not in Web Crypto API |
| sha256sum | ✅ | Already done | 🟢 | None | HASH_SHA256 - excellent for pipes |
| sha384sum | ✅ | Already done | 🟢 | None | HASH_SHA384 - excellent for pipes |
| sha512sum | ✅ | Already done | 🟢 | None | HASH_SHA512 - excellent for pipes |
| cksum | ✅ | Already done | 🟢 | None | CKSUM - POSIX CRC checksum |
| crc32 | ✅ | Already done | 🟢 | None | CRC32 - standard CRC32 |
| sum | ✅ | Already done | 🟢 | None | SUM_BSD - BSD/SysV checksums |
| xxd | ✅ | Already done | 🟢 | None | XXD - hex dump with encode/decode |
| hexdump | ✅ | Already done | 🟢 | None | HEXDUMP - formatted hex dump |
| od | ✅ | Already done | 🟢 | None | OD - octal/hex/decimal/char dump |

## Compression & Archives

| Command | Status | Suitability | Pipeline | Dependencies | Notes |
|---------|--------|-------------|----------|--------------|-------|
| gunzip | ✅ | Already done | 🟢 | zlib (built-in) | GUNZIP - decompress gzip data |
| gzip | ✅ | Already done | 🟢 | zlib (built-in) | GZIP - compress data |
| bunzip2 | 🟡 | Medium | 🟢 | seek-bzip | Bzip2 decompression |
| bzcat | 🟡 | Medium | 🟢 | seek-bzip | Bzip2 cat |
| xzcat | 🟡 | Medium | 🟢 | lzma-native | XZ decompression |
| zcat | ✅ | Already done | 🟢 | zlib (built-in) | ZCAT - decompress and output gzip |
| tar | 🟡 | Medium | 🟡 | tar-stream | Tar archives - complex |
| cpio | 🔴 | Low | 🟡 | No good library | Rare format |

## System Information

| Command | Status | Suitability | Pipeline | Dependencies | Notes |
|---------|--------|-------------|----------|--------------|-------|
| pwd | ✅ | Already done | 🟢 | None | PATH_RESOLVE('.') |
| uname | ✅ | Already done | 🟢 | None | UNAME - os.platform(), os.release() |
| hostname | ✅ | Already done | 🟢 | None | HOSTNAME - os.hostname() |
| whoami | ✅ | Already done | 🟢 | None | WHOAMI - os.userInfo().username |
| id | ✅ | Already done | 🟢 | None | USERINFO - os.userInfo() object |
| groups | ✅ | Already done | 🟢 | None | GROUPS - user group memberships |
| logname | ✅ | Already done | 🟢 | None | LOGNAME - login username |
| nproc | ✅ | Already done | 🟢 | None | NPROC - os.cpus().length |
| arch | ✅ | Already done | 🟢 | None | ARCH - os.arch() |
| env | ✅ | Already done | 🟢 | None | ENV - process.env or specific var |
| printenv | ✅ | Already done | 🟢 | None | ENV - process.env values |
| getconf | ✅ | Already done | 🟢 | None | GETCONF - system config values |
| uptime | ✅ | Already done | 🟢 | None | UPTIME - os.uptime() seconds |
| dnsdomainname | ✅ | Already done | 🟢 | None | DNSDOMAINNAME - extract domain from hostname |
| free | 🔴 | Low | 🟢 | None | Memory info - os.freemem() limited |
| vmstat | 🔴 | Low | 🟢 | /proc parsing | Virtual memory stats |
| w | 🔴 | Low | 🟢 | utmp parsing | Who is logged in |
| who | 🔴 | Low | 🟢 | utmp parsing | Who is logged in |

## Process Management

| Command | Status | Suitability | Pipeline | Dependencies | Notes |
|---------|--------|-------------|----------|--------------|-------|
| kill | ✅ | Already done | ❌ | None | KILL - send signal to process |
| killall | 🟡 | Medium | ❌ | None | Find + kill - side effects |
| killall5 | 🔴 | Low | ❌ | System specific | Kill all processes |
| pkill | 🟡 | Medium | ❌ | None | Kill by pattern - side effects |
| pidof | 🟡 | Medium | 🟢 | ps-list | Find PID - returns array |
| pgrep | 🟡 | Medium | 🟢 | ps-list | Find processes - returns array |
| ps | 🟡 | Medium | 🟢 | ps-list | Process list - returns array |
| top | 🔴 | Low | ❌ | Interactive | Real-time viewer |
| iotop | 🔴 | Low | ❌ | Kernel support | I/O monitoring |
| pmap | 🔴 | Low | 🟢 | /proc parsing | Memory map - returns data |
| pwdx | 🟡 | Medium | 🟢 | /proc parsing | Process cwd - returns path |
| timeout | ✅ | Already done | 🟡 | None | TIMEOUT - run with time limit |
| time | ✅ | Already done | 🟢 | None | process.hrtime() - returns duration |
| sleep | ✅ | Already done | ❌ | None | SLEEP - blocking delay (busy-wait) |
| usleep | ✅ | Already done | ❌ | None | SLEEP - same as sleep |
| nohup | 🟡 | Medium | ❌ | None | child_process detached |
| nice | 🔴 | Low | ❌ | Not well supported | Process priority |
| renice | 🔴 | Low | ❌ | Not well supported | Change priority |
| ionice | 🔴 | Low | ❌ | Linux specific | I/O priority |
| iorenice | 🔴 | Low | ❌ | Linux specific | I/O priority |
| chrt | 🔴 | Low | ❌ | Linux specific | Real-time scheduling |
| taskset | 🔴 | Low | ❌ | Linux specific | CPU affinity |

## Utilities

| Command | Status | Suitability | Pipeline | Dependencies | Notes |
|---------|--------|-------------|----------|--------------|-------|
| echo | 🔴 | Not suitable | 🟢 | None | Conflicts with ADDRESS environments |
| yes | ✅ | Already done | 🟢 | None | YES - repeat text N times |
| true | ✅ | Already done | ❌ | None | TRUE - returns true |
| false | ✅ | Already done | ❌ | None | FALSE - returns false |
| test | 🟢 | High | 🟡 | None | Conditional (already in REXX) |
| seq | ✅ | Already done | 🟢 | None | SEQ - generate sequences |
| shuf | ✅ | Already done | 🟢 | None | SHUF - shuffle lines |
| factor | ✅ | Already done | 🟢 | None | FACTOR - prime factorization |
| cal | ✅ | Already done | 🟢 | None | CAL - calendar generator |
| date | ✅ | Already done | 🟢 | None | DATE, TIME, NOW - returns values |
| mcookie | ✅ | Already done | 🟢 | None | MCOOKIE - random hex cookie |
| mktemp | ✅ | Already done | 🟢 | None | MKTEMP - temp file path generator |
| mkpasswd | ✅ | Already done | 🟢 | None | MKPASSWD - password hashing |
| uuidgen | ✅ | Already done | 🟢 | None | UUID - returns string |
| which | ✅ | Already done | 🟢 | None | WHICH - search PATH for command |
| getopt | ✅ | Already done | 🟡 | None | GETOPT - parse options, returns object |
| xargs | ✅ | Already done | 🟢 | None | XARGS - build commands from input |
| logger | 🟡 | Medium | ❌ | syslog | Send to syslog - side effects |
| ascii | ✅ | Already done | 🟢 | None | ASCII - ASCII table and char info |
| count | ❌ | Unknown | ❌ | Unknown | Unclear what this does |
| help | ❌ | Meta | ❌ | N/A | Help system |

## Network Operations

| Command | Status | Suitability | Pipeline | Dependencies | Notes |
|---------|--------|-------------|----------|--------------|-------|
| nc | 🟡 | Medium | 🟢 | net module | Netcat - can stream data |
| netcat | 🟡 | Medium | 🟢 | net module | Alias for nc |
| ftpget | 🟡 | Medium | 🟢 | ftp library | FTP download - returns data |
| ftpput | 🟡 | Medium | ❌ | ftp library | FTP upload - side effects |
| httpd | 🟡 | Medium | ❌ | http module | HTTP server - daemon |
| host | ✅ | Already done | 🟢 | None (built-in) | HOST - DNS lookup, returns IPs |
| ping | 🟡 | Medium | 🟢 | ping library | ICMP ping - returns stats |
| ping6 | 🟡 | Medium | 🟢 | ping library | IPv6 ping |
| traceroute | 🟡 | Medium | 🟢 | Complex | Route tracing - returns hops |
| netstat | 🔴 | Low | 🟢 | /proc parsing | Network stats - returns data |
| ifconfig | ✅ | Already done | 🟢 | None (built-in) | IFCONFIG - network interfaces info |
| sntp | 🟡 | Medium | 🟢 | ntp library | SNTP client - returns time |

## System/Hardware - Low Priority

| Command | Status | Suitability | Pipeline | Dependencies | Notes |
|---------|--------|-------------|----------|--------------|-------|
| acpi | ❌ | Not suitable | ❌ | System specific | ACPI info |
| blkid | ❌ | Not suitable | 🟢 | blkid binary | Block device IDs |
| blockdev | ❌ | Not suitable | ❌ | Requires root | Block device control |
| blkdiscard | ❌ | Not suitable | ❌ | Requires root | Discard sectors |
| chattr | ❌ | Not suitable | ❌ | Linux specific | Extended attributes |
| lsattr | ❌ | Not suitable | 🟢 | Linux specific | List extended attrs |
| chroot | 🔴 | Low | ❌ | process.chroot() | Requires root |
| chvt | ❌ | Not suitable | ❌ | Console specific | Change VT |
| deallocvt | ❌ | Not suitable | ❌ | Console specific | Deallocate VT |
| devmem | ❌ | Not suitable | ❌ | /dev/mem | Memory access |
| dmesg | ❌ | Not suitable | 🟢 | Kernel specific | Kernel ring buffer |
| eject | ❌ | Not suitable | ❌ | Hardware | Eject media |
| freeramdisk | ❌ | Not suitable | ❌ | Kernel specific | Free ramdisk |
| fsfreeze | ❌ | Not suitable | ❌ | Requires root | Freeze filesystem |
| fstype | 🔴 | Low | 🟢 | File inspection | Detect FS type |
| fsync | ✅ | Already done | ❌ | None | FSYNC - flush file to disk |
| gpio* | ❌ | Not suitable | ❌ | Hardware | GPIO operations |
| halt | ❌ | Not suitable | ❌ | System control | Shutdown |
| hwclock | ❌ | Not suitable | 🟢 | Hardware | Hardware clock |
| i2c* | ❌ | Not suitable | ❌ | Hardware | I2C bus |
| insmod | ❌ | Not suitable | ❌ | Kernel modules | Insert module |
| losetup | ❌ | Not suitable | ❌ | Loop devices | Setup loop |
| lsmod | ❌ | Not suitable | 🟢 | Kernel modules | List modules |
| lspci | ❌ | Not suitable | 🟢 | Hardware | PCI devices |
| lsusb | ❌ | Not suitable | 🟢 | Hardware | USB devices |
| makedevs | ❌ | Not suitable | ❌ | Requires root | Create dev nodes |
| memeater | ❌ | Not suitable | ❌ | Testing tool | Memory test |
| microcom | ❌ | Not suitable | ❌ | Serial port | Serial terminal |
| mix | ❌ | Not suitable | ❌ | Audio hardware | Audio mixer |
| mkswap | ❌ | Not suitable | ❌ | Requires root | Create swap |
| modinfo | ❌ | Not suitable | 🟢 | Kernel modules | Module info |
| mount | ❌ | Not suitable | ❌ | Requires root | Mount filesystems |
| mountpoint | 🔴 | Low | 🟢 | fs.statSync | Test if mountpoint |
| nbd-client | ❌ | Not suitable | ❌ | NBD | NBD client |
| nbd-server | ❌ | Not suitable | ❌ | NBD | NBD server |
| nsenter | ❌ | Not suitable | ❌ | Namespaces | Enter namespace |
| oneit | ❌ | Not suitable | ❌ | Init system | Simple init |
| openvt | ❌ | Not suitable | ❌ | Console | Open VT |
| partprobe | ❌ | Not suitable | ❌ | Requires root | Probe partitions |
| pivot_root | ❌ | Not suitable | ❌ | Requires root | Change root |
| poweroff | ❌ | Not suitable | ❌ | System control | Power off |
| reboot | ❌ | Not suitable | ❌ | System control | Reboot |
| reset | 🔴 | Low | ❌ | Terminal | Reset terminal |
| rfkill | ❌ | Not suitable | ❌ | Hardware | RF kill switch |
| rmmod | ❌ | Not suitable | ❌ | Kernel modules | Remove module |
| setfattr | ❌ | Not suitable | ❌ | Linux specific | Set extended attrs |
| setsid | 🔴 | Low | ❌ | child_process | Create session |
| shred | 🟡 | Medium | ❌ | None | Secure delete - side effects |
| stty | 🔴 | Low | ❌ | Terminal | Terminal settings |
| su | ❌ | Not suitable | ❌ | Security | Switch user |
| sulogin | ❌ | Not suitable | ❌ | System login | Single user login |
| swapoff | ❌ | Not suitable | ❌ | Requires root | Disable swap |
| swapon | ❌ | Not suitable | ❌ | Requires root | Enable swap |
| switch_root | ❌ | Not suitable | ❌ | Requires root | Switch root |
| sync | ✅ | Already done | ❌ | None | SYNC - synchronize filesystems |
| sysctl | ❌ | Not suitable | ❌ | Kernel params | Kernel settings |
| tty | ✅ | Already done | 🟢 | None | TTY - check if running in terminal |
| tunctl | ❌ | Not suitable | ❌ | Network tunnels | TUN/TAP control |
| ulimit | 🔴 | Low | 🟢 | process.getrlimit | Resource limits - returns info |
| umount | ❌ | Not suitable | ❌ | Requires root | Unmount |
| unshare | ❌ | Not suitable | ❌ | Namespaces | Unshare namespace |
| vconfig | ❌ | Not suitable | ❌ | Network config | VLAN config |

## Interactive/Editors - Not Suitable

| Command | Status | Suitability | Pipeline | Dependencies | Notes |
|---------|--------|-------------|----------|--------------|-------|
| hexedit | ❌ | Not suitable | ❌ | Interactive | Hex editor |
| vi | ❌ | Not suitable | ❌ | Interactive | Text editor |
| login | ❌ | Not suitable | ❌ | System login | Login shell |
| sh | ❌ | Not suitable | ❌ | Shell | Shell interpreter |

## File Watching

| Command | Status | Suitability | Pipeline | Dependencies | Notes |
|---------|--------|-------------|----------|--------------|-------|
| inotifyd | 🟡 | Medium | 🟢 | fs.watch/chokidar | File watching - event stream |
| flock | 🟡 | Medium | ❌ | Workarounds | File locking - side effects |
| watch | 🟡 | Medium | 🟢 | None | Periodic execution - event stream |

---

## Priority Summary

### **Implement First (High Value, Zero Deps, Pipeline-Friendly):**

**Text Processing (🟢 Pipeline Perfect):**
1. ✅ head, tail - First/last N lines
2. ✅ wc - Word/line/char count
3. ✅ cut - Column extraction
4. ✅ paste - Merge lines
5. ✅ sort - Sort lines
6. ✅ uniq - Deduplicate
7. ✅ nl - Number lines
8. ✅ tac, rev - Reverse operations
9. ✅ fold, expand - Text wrapping and tab expansion
10. ✅ dos2unix, unix2dos - Line endings
11. strings - Extract printable strings
12. fmt - Format paragraphs
13. ✅ tee - Duplicate output

**Hashing (🟢 Pipeline Perfect):**
1. sha224sum, sha384sum, sha512sum - Additional SHA variants
2. cksum, crc32 - CRC checksums
3. base32 - Base32 encoding
4. uuencode, uudecode - UU encoding
5. xxd, hexdump, od - Hex/octal dumps

**System Info (🟢 Pipeline Perfect):**
1. uname - OS info
2. hostname - Hostname
3. whoami, id - User info
4. nproc - CPU count
5. arch - Architecture
6. env, printenv - Environment
7. uptime - System uptime

**Utilities (🟢 Pipeline Perfect):**
1. echo - Output text
2. ✅ seq - Generate sequences
3. ✅ shuf - Shuffle lines
4. factor - Prime factorization
5. cal - Calendar
6. which - Find in PATH
7. mktemp - Temp files
8. mcookie - Random hex
9. ✅ xargs - Build commands

**File Operations (Some 🟢 Pipeline):**
1. readlink - Read symlink (🟢 pipeline)
2. cmp - Compare files (🟢 pipeline)
3. comm - Set operations (🟢 pipeline)
4. du - Disk usage (🟢 pipeline)
5. rmdir, touch, chmod, link (❌ not pipeline - side effects)

### **Implement Second (Small Deps Acceptable):**
1. **Compression:** gunzip/gzip (zlib built-in), tar
2. **Diffing:** diff, patch
3. **Process:** pidof, pgrep, ps (all 🟢 pipeline - return data)
4. **Network:** nc, host (🟢 pipeline - stream/return data)
5. **Text:** sed (🟢 pipeline - stream editing)

### **Don't Implement:**
- Hardware/kernel operations (gpio, i2c, acpi, mount, etc.)
- Interactive tools (vi, hexedit, top)
- System administration requiring root (reboot, su, mount)
- Obscure/deprecated formats (cpio)

---

## Pipeline Champions (Top Priority)

These are **excellent** for |> pipelines:

1. ✅ **head, tail** - Essential for data sampling
2. ✅ **sort, uniq** - Essential for data cleanup
3. ✅ **cut, paste** - Essential for columnar data
4. ✅ **wc** - Essential for counting
5. ✅ **seq, shuf** - Essential for data generation
6. ✅ **tee** - Essential for pipeline branching
7. ✅ **xargs** - Essential for command building
8. **All hash functions** - Transform data to hashes
9. **All encoding functions** - Transform data encodings

Example pipeline usage:
```rexx
/* Count unique words in files */
LET wordCount = LS(path="*.txt")
  |> ARRAY_MAP(f => CAT(path=f.path))
  |> ARRAY_JOIN("\n")
  |> SPLIT_LINES
  |> SORT
  |> UNIQ
  |> WC(type="lines")

/* Hash all JS files */
LET hashes = LS(path="src", recursive=true, pattern="*.js")
  |> ARRAY_MAP(f => SHA256(CAT(path=f.path)))
```
