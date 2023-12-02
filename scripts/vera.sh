#!/usr/bin/env bash
# #####################################################################################################################
# ### Full path of the current script
THIS=$(readlink -f "${BASH_SOURCE[0]}" 2>/dev/null || echo $0)
#SCRIPT_PATH="$(dirname "$(realpath "${BASH_SOURCE:-$0}")")"
# ###
# ### The directory where current script resides
DIR=$(dirname "${THIS}")
#
# ### 'Dot' means 'source', i.e. 'include':
#. "$DIR/compile.sh"
# . "$DIR/common/console.sh"

# ###
#
set -o errexit
set -o pipefail
set -o nounset
# ###
#
# #####################################################################################################################
# ###   Load up config file
#
VERA_CONFIG_FILE=".config.md"
VERA_UNMOUNT_TIMEOUT=7
#
set -o allexport
# shellcheck disable=SC1090
[[ -f "${DIR}/${VERA_CONFIG_FILE}" ]] && source "${DIR}/${VERA_CONFIG_FILE}"
set +o allexport
#
# #####################################################################################################################
#
#LANG=en_US.UTF-8
LANG=${VERA_LANG:-en_US.UTF-8}
# ###
#export VERBOSE=${VERBOSE:-"1"}
#export DEBUG=${DEBUG:-"1"}
#export LOG_FILE=${LOG_FILE:-""}
#export LANG=en_US.UTF-8
VERBOSE=${VERBOSE:-"1"}
DEBUG=${DEBUG:-"1"}
LOG_FILE=${LOG_FILE:-"vera.log"}
LOG_LEVEL=${LOG_LEVEL:-"1"}
VERA_FORCE=${VERA_FORCE:-""}
VERA_RESULT=${VERA_RESULT:-""}

# #####################################################################################################################
if [ "$VERA_FORCE" ]; then VERA_FORCE="--force"; fi
# #####################################################################################################################
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

# #####################################################################################################################
# ###   log without '\n' at end
#
#color_normal="\e[m"
#color_error="\e[38;5;1m"

_log() {
  if [ "$LOG_FILE" ]; then
    # echo "$@" >>"$LOG_FILE"
    echo -e "$(_date) > " "$@" >>"$LOG_FILE"
  fi
  if [ "$VERBOSE" ] && [ "$VERBOSE" -ge 1 ]; then
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
}

_info() {
  if [ $# -gt 0 ]; then
    echo "$1"
    _log "[$(_date_u)] $1"
  elif [ $# -ge 2 ]; then
    echo "$1" == "'$2'"
    _log "[$(_date_u)] $1" == "'$2'"
  fi
}

_err() {
  _log "$(_info "$@")\n" >&2
  return 1
}

_debug() {
  if [ -z "$DEBUG" ]; then
    return
  fi
  #_info "$@" >&2
  _log "$@" >&2
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

# ###   dbg with '\n' at end
dbg() {
  if [ "$DEBUG" ] && [ "$DEBUG" -ge "1" ]; then
    _debug "$@"
  fi
  if [ "$DEBUG" ] && [ "$DEBUG" -ge "2" ]; then
    _debug2 "$@"
  fi
  if [ "$DEBUG" ] && [ "$DEBUG" -ge "3" ]; then
    _debug3 "$@"
  fi
  return
}


# #####################################################################################################################
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

# #####################################################################################################################
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

# #####################################################################################################################
# ###
#
create() {
  if [[ -z "${OS_PASSWORD-}" ]]; then
    _err "create error: OS_PASSWORD is empty!"
    return 1
  fi

  if [[ -f "$VOLUME_FILE" ]]; then
    _err "create error: '$VOLUME_FILE' already exists!"
    return 1
  fi

  log "create: '$VOLUME_FILE'"
  echo "$OS_PASSWORD" | sudo -S veracrypt -t -c "$VOLUME_FILE" --volume-type=normal --pim=0 -k "$VOLUME_KEYFILE" --quick --encryption="$VOLUME_ENC" --hash="$VOLUME_HASH" --filesystem="$VOLUME_FS" --size="$VOLUME_SIZE" --password="$VOLUME_PASSWORD" --random-source=/dev/urandom
  # result="$?"
  sleep 1

}

# ###
umount() {
  if [[ -z "${OS_PASSWORD-}" ]]; then
    _err "umount error: OS_PASSWORD is empty!"
    return 1
  fi

  if [[ ! -d "${VOLUME_MOUNTPATH}" ]]; then
    _err "error: ${VOLUME_MOUNTPATH} not mounted !"
    return 1
  fi

  log "umount $VOLUME_FILE from $VOLUME_MOUNTPATH"
  echo -e "umount: $(_date)">$VOLUME_MOUNTPATH/$VOLUME_INFO

  echo "$OS_PASSWORD" | sudo -S veracrypt -t -d "$VOLUME_FILE" --non-interactive
  # result=$(echo "$OS_PASSWORD" | sudo -S veracrypt -t -d "$VOLUME_FILE" --non-interactive)
  # result="$?"

  timeout=$VERA_UNMOUNT_TIMEOUT
  until (( $timeout == 0 ))
  do
    sleep 1
    if [[ ! -d "${VOLUME_MOUNTPATH}" ]]; then
      break
    else
      echo "$OS_PASSWORD" | sudo -S rm -d "$VOLUME_MOUNTPATH" >/dev/null 2>&1
    fi

    if [[ $VERBOSE -ge 2 ]]; then
      # shellcheck disable=SC2027
      echo "remove "$VOLUME_MOUNTPATH" try $timeout"
    fi
    (( timeout-- ))
  done
}

# ###
mount() {
  if [[ -z "${OS_PASSWORD-}" ]]; then
    _err "mount error: OS_PASSWORD is empty!"
    return 1
  fi

  if [[ -d "$VOLUME_MOUNTPATH" ]]; then
    log "already mounted to $VOLUME_MOUNTPATH"
    umount
  else
    log "mkdir: $VOLUME_MOUNTPATH"
    mkdir -p "$VOLUME_MOUNTPATH" >/dev/null 2>&1
  fi

  if [[ -f "$VOLUME_FILE" ]]; then
    log "mount '$VOLUME_FILE' ==> '$VOLUME_MOUNTPATH'"
    echo "$OS_PASSWORD" | sudo -S veracrypt -t --password="$VOLUME_PASSWORD" --protect-hidden=no --pim=0 --keyfiles="$VOLUME_KEYFILE" "$VOLUME_FILE" "$VOLUME_MOUNTPATH"
    # result=$(echo "$OS_PASSWORD" | sudo -S veracrypt --text --password="$VOLUME_PASSWORD" --protect-hidden=no --pim=0 --keyfiles="$VOLUME_KEYFILE" "$VOLUME_FILE" "$VOLUME_MOUNTPATH")
    # result="$?"
    sleep 1
    #echo "${OS_PASSWORD}" | sudo -S chown -R "$USER:$USER" "${VOLUME_MOUNTPATH}"
    #echo "$OS_PASSWORD" | sudo -S chown "$USER:$USER" "$VOLUME_MOUNTPATH"
    #echo "$OS_PASSWORD" | sudo -S chmod 777 "$VOLUME_MOUNTPATH"

    echo -e "mount: $(_date)">$VOLUME_MOUNTPATH/$VOLUME_INFO
  fi
}

# ###   mounted
ismounted() {
  sleep 1
  if _contains "$(df -hT "$VOLUME_MOUNTPATH")" "$VOLUME_MOUNTPATH"; then
    log "$VOLUME_MOUNTPATH ismounted "
    echo "$VOLUME_MOUNTPATH"
  else
    log "$VOLUME_MOUNTPATH not mounted "
  fi
}

# ###
list() {
  # NOTMOUNTED="Error: No volumes mounted."
  # veracrypt --text --list --non-interactive >/dev/null 2>&1
  result="$(veracrypt -t -l --non-interactive)"
  echo "result: ${result}"
}

# ### If you want to identify block devices which are not in-use, you can combine 'lsblk' with option '-T' or '--tree' and 'jq' command. It is used to transform JSON data into a more readable format and display it to the standard output.
# lsblk --tree -o PATH,MOUNTPOINT -J | jq -r '.blockdevices[] | del(select(.mountpoint!=null or .children[]?.mountpoint!=null)) | .path // empty'
# ###
fstat() {
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

install() {
  ###   check VeraCrypt installed?
  result=$(veracrypt -t --version --non-interactive)
  if _startswith "$result" "VeraCrypt "; then
    ###   VeraCrypt installed!
    export VERA_VERSION="$result"
    if [[ $VERBOSE -ge 2 ]]; then
      # shellcheck disable=SC2027
      log "$result"
    fi
  else
    log "error: VeraCrypt not installed!"
    # sudo apt install -y exfat-fuse exfat-utils dmsetup
    sudo apt install -y veracrypt exfat-fuse dmsetup
  fi
}

# #####################################################################################################################

showhelp() {
  echo "Usage:"
  echo "$0 command args"
  echo "Commands list:"
  echo ""
  echo "install"
  echo "create"
  echo "mount"
  echo "umount"
  echo "list"
  echo "fstat"
}

testim() {
  create
  mount
  list
  #ismounted
  #fstat
  umount
}

# #####################################################################################################################
# ###
#

if [ $# == 0 ]; then
  showhelp
  exit
else
  install
  if [ "$1" == "install" ]; then
    exit
  fi
  if [ "${VOLUME_COMMAND-}" != "" ]; then
    echo "VOLUME_COMMAND: " "$VOLUME_COMMAND"
    "$VOLUME_COMMAND"
    exit
  fi
  "$@"
fi
