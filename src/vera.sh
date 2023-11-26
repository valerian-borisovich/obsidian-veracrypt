#!/usr/bin/env bash
# ############################################################################
# ###
#
set -o errexit
set -o pipefail
set -o nounset

# ###
#
__dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
#

# ############################################################################
# ###   Load up .env
#set -o allexport
#[[ -f "${__dir}/.env" ]] && source "${__dir}/.env"
#set +o allexport
# ############################################################################
#
# ###
export VERBOSE=${VERBOSE:-"1"}
export DEBUG=${DEBUG:-"1"}
export LOG_FILE=${LOG_FILE:-""}
#LOG_FILE=${LOG_FILE:-"./vera.log"}
export LANG=en_US.UTF-8

# ################################################################################################
# ###
#
_date_u() {
  date -u +"%a, %d %b %Y %T %Z"
}

# ### date -u '+%s'
_date() {
  # date -u --iso-8601
  date -u '+%s'
}

# ################################################################################################
# ###   log without '\n' at end
#
_log() {
  if [ "$LOG_FILE" ]; then
    # echo "$@" >>"$LOG_FILE"
    echo -e "$(_date) > " + "$@" >>"$LOG_FILE"
  fi
  if [ "$VERBOSE" ] && [ "$VERBOSE" -ge "1" ]; then
    # printf -- "%s \n" "[$(date)] : $@"
    printf -- "%s   " "$@"
  fi
}

# ###   log with '\n' at end
log() {
  _log "$@"
  if [ "$LOG_FILE" ]; then
    echo ""
  fi
  echo ""
}

_info() {
  if [ -z "$2" ]; then
    echo "$1"
    _log "[$(_date_u)] $1"
  else
    echo "$1"="'$2'"
    _log "[$(_date_u)] $1"="'$2'"
  fi
}

_err() {
  __red "$(_info "$@")\n" >&2
  return 1
}

_debug() {
  if [ -z "$DEBUG" ]; then
    return
  fi
  _info "$@" >&2
  return 0
}

_debug2() {
  if [ "$DEBUG" ] && [ "$DEBUG" -ge "2" ]; then
    _debug "$@"
  fi
  return
}

_debug3() {
  if [ "$DEBUG" ] && [ "$DEBUG" -ge "3" ]; then
    _debug "$@"
  fi
  return
}

# ################################################################################################
# ###     contains sub in str
#
_contains() {
  _str="$1"
  _sub="$2"
  echo $_str | grep $_sub >/dev/null 2>&1
}

# ###     startswith
_startswith() {
  _str="$1"
  _sub="$2"
  echo "$_str" | grep -- "^$_sub" >/dev/null 2>&1
}

# ################################################################################################
# ###     options file
#
_sed_i() {
  options="$1"
  filename="$2"
  if [ -z "$filename" ]; then
    _err "Usage:_sed_i options filename"
    return 1
  fi
  _debug2 options "$options"
  if sed -h 2>&1 | grep "\-i\[SUFFIX]" >/dev/null 2>&1; then
    _debug "Using sed  -i"
    sed -i "$options" "$filename"
  else
    _debug "No -i support in sed"
    text="$(cat "$filename")"
    echo "$text" | sed "$options" >"$filename"
  fi
}

# ###    setopt "file"  "opt"  "="  "value" [";"]
_setopt() {
  __conf="$1"
  __opt="$2"
  __sep="$3"
  __val="$4"
  __end="$5"
  if [ -z "$__opt" ]; then
    echo usage: _setopt '"file"  "opt"  "="  "value" [";"]'
    return
  fi
  if [ ! -f "${__conf}" ]; then
    touch "${__conf}"
  fi
  if grep -n "^$__opt$__sep" "${__conf}" >/dev/null; then
    _debug3 OK
    if _contains "$__val" "&"; then
      __val="$(echo $__val | sed 's/&/\\&/g')"
    fi

    text="$(cat "${__conf}")"
    echo "$text" | sed "s#^$__opt.*#$__opt$__sep$__val$__end#" >"${__conf}"

  else
    _debug3 APP
    echo "$__opt$__sep$__val$__end" >>"${__conf}"
  fi
}

# ###    setenv "file"  "opt"  "="  "value" [";"]
setenv() {
  # _setopt "$1" "$2" "=" "$3" ";"
  _setopt "$1" "$2" "=" "$3" ""
}

# ############################################################################
# ###
#
create() {
  if [[ -f "${VOLUME_FILE}" ]]; then
    log "already exists '${VOLUME_FILE}'! skip create..."
  else
    log "create: '${VOLUME_FILE}'"
    echo "${SUDO_PASSWORD}" | sudo -S veracrypt -t -c "${VOLUME_FILE}" --volume-type=normal --pim=0 -k "${VOLUME_KEYFILE}" --quick --encryption="$VOLUME_ENC" --hash="$VOLUME_HASH" --filesystem="$VOLUME_FS" --size="$VOLUME_SIZE" --password="$VOLUME_PASSWORD" --random-source=/dev/urandom
    ret="$?"
    sleep 1
    if [[ ! -z "$ret" ]]; then
      log "create fail: $ret"
      return "$ret"
    fi
  fi
}

# ###
umount() {
  log "umount at ${VOLUME_MOUNTPATH}"
  setenv "${VOLUME_MOUNTPATH}/.env" "UMOUNT" "$(_date)"  >/dev/null 2>&1
  echo "${SUDO_PASSWORD}" | sudo -S veracrypt -t -d "${VOLUME_FILE}" --non-interactive  >/dev/null 2>&1
  ret="$?"
  sleep 1
  echo "${SUDO_PASSWORD}" | sudo -S rm "${VOLUME_MOUNTPATH}" >/dev/null 2>&1
  return "$ret"
}

# ###
mount() {
  if [[ -d "${VOLUME_MOUNTPATH}" ]]; then
    if [[ -f "${VOLUME_MOUNTPATH}/.env" ]]; then
    log "already mounted to ${VOLUME_MOUNTPATH}"
    umount
    fi
  else
    log "mkdir: ${VOLUME_MOUNTPATH}"
    mkdir -p "${VOLUME_MOUNTPATH}" >/dev/null 2>&1
  fi

  log "mount '${VOLUME_FILE}' ==> '${VOLUME_MOUNTPATH}'"
  echo "${SUDO_PASSWORD}" | sudo -S veracrypt --text --password="${VOLUME_PASSWORD}" --protect-hidden=no --pim=0 --keyfiles="${VOLUME_KEYFILE}" "${VOLUME_FILE}" "${VOLUME_MOUNTPATH}" >/dev/null 2>&1
  ret="$?"
  sleep 1
  #echo "${SUDO_PASSWORD}" | sudo -S chown -R "$USER:$USER" "${VOLUME_MOUNTPATH}"
  echo "${SUDO_PASSWORD}" | sudo -S chown "$USER:$USER" "${VOLUME_MOUNTPATH}"
  echo "${SUDO_PASSWORD}" | sudo -S chmod 777 "${VOLUME_MOUNTPATH}"
  #echo "${SUDO_PASSWORD}" | sudo -S chmod -R 600 "${VOLUME_MOUNTPATH}"
  # setenv "${VOLUME_MOUNTPATH}/.env" "MOUNT" "$(_date)"  >/dev/null 2>&1
  # echo "${SUDO_PASSWORD}" | rm -rf "${VOLUME_MOUNTPATH}"/lost+found  >/dev/null 2>&1
}

# ###   verify mounted
verify() {
  sleep 1
  if _contains "$(df -hT "${VOLUME_MOUNTPATH}")" "${VOLUME_MOUNTPATH}"; then
    log "verify OK ${VOLUME_MOUNTPATH}"
    return 0
  else
    log "verify FAIL ${VOLUME_MOUNTPATH}"
    return 1
  fi
}

# ###
list() {
  NOTMOUNTED="Error: No volumes mounted."
  # log "list mounted:"
  # veracrypt --text --list --non-interactive >/dev/null 2>&1
  veracrypt -t -l --non-interactive
  ret="$?"
  return 0
}

# ### If you want to identify block devices which are not in-use, you can combine 'lsblk' with option '-T' or '--tree' and 'jq' command. It is used to transform JSON data into a more readable format and display it to the standard output.
# lsblk --tree -o PATH,MOUNTPOINT -J | jq -r '.blockdevices[] | del(select(.mountpoint!=null or .children[]?.mountpoint!=null)) | .path // empty'
# ###
stat() {
  # lsblk --output-all --json
  #
  # ###  print device owner, group, and mode
  # lsblk -m
  # ###  print only selected column, [to hide column headings use: -dn]
  # lsblk -o NAME,SIZE,MOUNTPOINT
  # ###  To find out what is SSD or Hard Disk Drive
  # lsblk --output +ROTA,DISC-GRAN  -e7
  # ###  Exclude the loop devices:
  # lsblk -f -e7
  # ###  Display size column in byte format
  # lsblk -f -b
  lsblk -f -b -e7
}

showhelp() {
  echo -e "Usage:"
  echo -e "$0 command"
  echo -e "Commands list:"
  echo -e "create"
  echo -e "mount"
  echo -e "umount"
  echo -e "list"
  echo -e "stat"
}

testim() {
create
mount
# list
verify
stat
# umount
}

log "vera.sh started: " "$@"
env > env.txt

if [ "$#" == 0 ]; then
  showhelp
else
  "$@"
fi
