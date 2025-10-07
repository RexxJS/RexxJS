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
| rmdir | 🟢 | High | ❌ | None | fs.rmdirSync - side effects |
| stat | ✅ | Already done | 🟢 | None | STAT - returns metadata |
| cmp | 🟢 | High | 🟢 | None | Compare two files, returns diff |
| comm | 🟢 | High | 🟢 | None | Set operations on sorted files |
| du | 🟢 | High | 🟢 | None | Disk usage - returns sizes |
| file | 🟡 | Medium | 🟢 | file-type | MIME type - returns string |
| install | 🟢 | High | ❌ | None | Like cp but sets permissions |
| link | 🟢 | High | ❌ | None | fs.linkSync - side effects |
| ln | 🟢 | High | ❌ | None | fs.symlinkSync - side effects |
| readlink | 🟢 | High | 🟢 | None | fs.readlinkSync - returns path |
| realpath | ✅ | Already done | 🟢 | None | PATH_RESOLVE |
| touch | 🟢 | High | ❌ | None | fs.utimesSync - side effects |
| truncate | 🟢 | High | ❌ | None | fs.truncateSync - side effects |
| unlink | 🟢 | High | ❌ | None | fs.unlinkSync - side effects |
| chgrp | 🟢 | High | ❌ | None | fs.chownSync - side effects |
| chmod | 🟢 | High | ❌ | None | fs.chmodSync - side effects |
| chown | 🟢 | High | ❌ | None | fs.chownSync - side effects |
| mkfifo | 🔴 | Low | ❌ | None | Named pipes, niche use |
| mknod | 🔴 | Low | ❌ | None | Device nodes, requires root |

## Text Processing

| Command | Status | Suitability | Pipeline | Dependencies | Notes |
|---------|--------|-------------|----------|--------------|-------|
| grep | ✅ | Already done | 🟢 | None | GREP - returns matches |
| cut | 🟢 | High | 🟢 | None | Column extraction - perfect for pipes |
| paste | 🟢 | High | 🟢 | None | Merge lines - good for pipes |
| head | 🟢 | High | 🟢 | None | First N lines - excellent for pipes |
| tail | 🟢 | High | 🟢 | None | Last N lines - excellent for pipes |
| wc | 🟢 | High | 🟢 | None | Word/line/char count |
| sort | 🟢 | High | 🟢 | None | Sort lines - excellent for pipes |
| uniq | 🟢 | High | 🟢 | None | Deduplicate - excellent for pipes |
| tr | ✅ | Already done | 🟢 | None | TRANSLATE - char replacement |
| rev | 🟢 | High | 🟢 | None | Reverse lines - good for pipes |
| tac | 🟢 | High | 🟢 | None | Reverse file order - good for pipes |
| nl | 🟢 | High | 🟢 | None | Number lines - good for pipes |
| fold | 🟢 | High | 🟢 | None | Wrap lines - good for pipes |
| fmt | 🟢 | High | 🟢 | None | Format paragraphs - good for pipes |
| expand | 🟢 | High | 🟢 | None | Tabs to spaces - good for pipes |
| dos2unix | 🟢 | High | 🟢 | None | Line ending conversion |
| unix2dos | 🟢 | High | 🟢 | None | Line ending conversion |
| strings | 🟢 | High | 🟢 | None | Extract printable - good for pipes |
| split | 🟢 | High | 🟡 | None | Split file - writes files |
| tee | 🟢 | High | 🟢 | None | Duplicate output - classic pipe use |
| sed | 🟡 | Medium | 🟢 | Pure JS impl | Stream editor - excellent for pipes |
| awk | 🔴 | Low | 🟢 | Complex | Full language, use JS instead |
| diff | 🟡 | Medium | 🟢 | jsdiff | Text diffing - returns diff |
| patch | 🟡 | Medium | 🟡 | diff library | Apply patches |

## Encoding & Hashing

| Command | Status | Suitability | Pipeline | Dependencies | Notes |
|---------|--------|-------------|----------|--------------|-------|
| base32 | 🟢 | High | 🟢 | None | Encoding - good for pipes |
| base64 | ✅ | Already done | 🟢 | None | BASE64_ENCODE/BASE64_DECODE |
| uudecode | 🟢 | High | 🟢 | None | Decoding - good for pipes |
| uuencode | 🟢 | High | 🟢 | None | Encoding - good for pipes |
| md5sum | ✅ | Already done | 🟢 | None | HASH_MD5 - excellent for pipes |
| sha1sum | ✅ | Already done | 🟢 | None | HASH_SHA1 - excellent for pipes |
| sha224sum | 🟢 | High | 🟢 | None | crypto.createHash('sha224') |
| sha256sum | ✅ | Already done | 🟢 | None | HASH_SHA256 - excellent for pipes |
| sha384sum | 🟢 | High | 🟢 | None | crypto.createHash('sha384') |
| sha512sum | 🟢 | High | 🟢 | None | crypto.createHash('sha512') |
| cksum | 🟢 | High | 🟢 | None | CRC checksum - good for pipes |
| crc32 | 🟢 | High | 🟢 | None | CRC32 - good for pipes |
| sum | 🟢 | High | 🟢 | None | BSD/SysV checksums |
| xxd | 🟢 | High | 🟢 | None | Hex dump - Buffer.toString('hex') |
| hexdump | 🟢 | High | 🟢 | None | Hex dump - excellent for pipes |
| od | 🟢 | High | 🟢 | None | Octal dump - good for pipes |

## Compression & Archives

| Command | Status | Suitability | Pipeline | Dependencies | Notes |
|---------|--------|-------------|----------|--------------|-------|
| gunzip | 🟡 | Medium | 🟢 | zlib (built-in) | zlib.gunzipSync - good for pipes |
| gzip | 🟡 | Medium | 🟢 | zlib (built-in) | zlib.gzipSync - good for pipes |
| bunzip2 | 🟡 | Medium | 🟢 | seek-bzip | Bzip2 decompression |
| bzcat | 🟡 | Medium | 🟢 | seek-bzip | Bzip2 cat |
| xzcat | 🟡 | Medium | 🟢 | lzma-native | XZ decompression |
| zcat | 🟡 | Medium | 🟢 | zlib (built-in) | Gzip cat - good for pipes |
| tar | 🟡 | Medium | 🟡 | tar-stream | Tar archives - complex |
| cpio | 🔴 | Low | 🟡 | No good library | Rare format |

## System Information

| Command | Status | Suitability | Pipeline | Dependencies | Notes |
|---------|--------|-------------|----------|--------------|-------|
| pwd | ✅ | Already done | 🟢 | None | PATH_RESOLVE('.') |
| uname | 🟢 | High | 🟢 | None | os.platform(), os.release() - returns info |
| hostname | 🟢 | High | 🟢 | None | os.hostname() - returns string |
| whoami | 🟢 | High | 🟢 | None | os.userInfo().username - returns string |
| id | 🟢 | High | 🟢 | None | os.userInfo() - returns object |
| groups | 🟢 | High | 🟢 | None | os.userInfo().groups - returns array |
| logname | 🟢 | High | 🟢 | None | os.userInfo().username |
| nproc | 🟢 | High | 🟢 | None | os.cpus().length - returns number |
| arch | 🟢 | High | 🟢 | None | os.arch() - returns string |
| env | 🟢 | High | 🟢 | None | process.env - returns object |
| printenv | 🟢 | High | 🟢 | None | process.env - returns values |
| getconf | 🟢 | High | 🟢 | None | Various configs - returns value |
| uptime | 🟢 | High | 🟢 | None | os.uptime() - returns number |
| dnsdomainname | 🟢 | High | 🟢 | None | os.hostname() parsing |
| free | 🔴 | Low | 🟢 | None | Memory info - os.freemem() limited |
| vmstat | 🔴 | Low | 🟢 | /proc parsing | Virtual memory stats |
| w | 🔴 | Low | 🟢 | utmp parsing | Who is logged in |
| who | 🔴 | Low | 🟢 | utmp parsing | Who is logged in |

## Process Management

| Command | Status | Suitability | Pipeline | Dependencies | Notes |
|---------|--------|-------------|----------|--------------|-------|
| kill | 🟢 | High | ❌ | None | process.kill - side effects |
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
| timeout | 🟢 | High | 🟡 | None | setTimeout + child_process |
| time | ✅ | Already done | 🟢 | None | process.hrtime() - returns duration |
| sleep | 🟢 | High | ❌ | None | setTimeout - delay only |
| usleep | 🟢 | High | ❌ | None | setTimeout - delay only |
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
| echo | 🟢 | High | 🟢 | None | Return string - good for pipes |
| yes | 🟢 | High | 🟢 | None | Infinite repeat - stream generator |
| true | 🟢 | High | ❌ | None | Always return 0 |
| false | 🟢 | High | ❌ | None | Always return 1 |
| test | 🟢 | High | 🟡 | None | Conditional (already in REXX) |
| seq | 🟢 | High | 🟢 | None | Generate sequence - excellent for pipes |
| shuf | 🟢 | High | 🟢 | None | Shuffle lines - excellent for pipes |
| factor | 🟢 | High | 🟢 | None | Prime factorization - good for pipes |
| cal | 🟢 | High | 🟢 | None | Calendar - returns formatted text |
| date | ✅ | Already done | 🟢 | None | DATE, TIME, NOW - returns values |
| mcookie | 🟢 | High | 🟢 | None | crypto.randomBytes - returns string |
| mktemp | 🟢 | High | 🟢 | None | os.tmpdir() - returns path |
| mkpasswd | 🟢 | High | 🟢 | None | crypto hashing - returns hash |
| uuidgen | ✅ | Already done | 🟢 | None | UUID - returns string |
| which | 🟢 | High | 🟢 | None | Search PATH - returns path |
| getopt | 🟢 | High | 🟡 | None | Parse options - returns object |
| xargs | 🟢 | High | 🟢 | None | Build commands - excellent for pipes |
| logger | 🟡 | Medium | ❌ | syslog | Send to syslog - side effects |
| ascii | 🟢 | High | 🟢 | None | ASCII table - returns string |
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
| host | 🟡 | Medium | 🟢 | dns module | DNS lookup - returns IPs |
| ping | 🟡 | Medium | 🟢 | ping library | ICMP ping - returns stats |
| ping6 | 🟡 | Medium | 🟢 | ping library | IPv6 ping |
| traceroute | 🟡 | Medium | 🟢 | Complex | Route tracing - returns hops |
| netstat | 🔴 | Low | 🟢 | /proc parsing | Network stats - returns data |
| ifconfig | 🔴 | Low | 🟢 | os.networkInterfaces() | Network config - returns info |
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
| fsync | 🟢 | High | ❌ | None | fs.fsyncSync - side effects |
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
| sync | 🟢 | High | ❌ | None | execSync('sync') - side effects |
| sysctl | ❌ | Not suitable | ❌ | Kernel params | Kernel settings |
| tty | 🟢 | High | 🟢 | None | process.stdin.isTTY - returns bool |
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
1. head, tail - First/last N lines
2. wc - Word/line/char count
3. cut - Column extraction
4. paste - Merge lines
5. sort - Sort lines
6. uniq - Deduplicate
7. nl - Number lines
8. tac, rev - Reverse operations
9. fold, fmt, expand - Text formatting
10. dos2unix, unix2dos - Line endings
11. strings - Extract printable strings
12. tee - Duplicate output

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
2. seq - Generate sequences
3. shuf - Shuffle lines
4. factor - Prime factorization
5. cal - Calendar
6. which - Find in PATH
7. mktemp - Temp files
8. mcookie - Random hex
9. xargs - Build commands

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

These are **excellent** for |> pipelines and should be implemented first:

1. **head, tail** - Essential for data sampling
2. **sort, uniq** - Essential for data cleanup
3. **cut, paste** - Essential for columnar data
4. **wc** - Essential for counting
5. **seq, shuf** - Essential for data generation
6. **tee** - Essential for pipeline branching
7. **xargs** - Essential for command building
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
