---
layout: article
title: grub2中iso-scan/filename参数
date: 2021-12-12 21:02:11 +0800
categories: notes
tags: Linux grub2
---
grub2引导ubuntu iso文件时，内核启动参数iso-scan/filename参数记录
<!--more-->

# iso-scan/filename参数
在使用grub2引导ubuntu21.04启动过程中遇到报错：/init:line 49:can't open /dev/sr0:no medium found，记录一下iso-scan/filename参数

iso-scan/filename后填写iso文件在其存放分区下的路径：
```
$ mount /dev/sdb3 /mnt
$ ls /mnt/iso/
ubuntu-21.04-desktop-amd64.iso
```
则iso-scan/filename=/iso/ubuntu-21.04-desktop-amd64.iso

**20iso_scan**
```
#!/bin/sh

PREREQ=""

prereqs()
{
       echo "$PREREQ"
}

case $1 in
# get pre-requisites
    prereqs)
           prereqs
           exit 0
           ;;
esac

. /scripts/casper-functions
. /scripts/lupin-helpers

iso_path=
for x in $(cat /proc/cmdline); do
    case ${x} in
        iso-scan/filename=*)
            iso_path=${x#iso-scan/filename=}
            ;;
    esac
done
if [ "$iso_path" ]; then
    if find_path "${iso_path}" /isodevice rw; then
        echo "LIVEMEDIA=${FOUNDPATH}" >> /conf/param.conf
        if [ -f "${FOUNDPATH}" ]; then
            echo "LIVEMEDIA_OFFSET=0" >> /conf/param.conf
        fi
    else
        panic "
Could not find the ISO $iso_path
This could also happen if the file system is not clean because of an operating
system crash, an interrupted boot process, an improper shutdown, or unplugging
of a removable device without first unmounting or ejecting it.  To fix this,
simply reboot into Windows, let it fully start, log in, run 'chkdsk /r', then
gracefully shut down and reboot back into Windows. After this you should be
able to reboot again and resume the installation.
"
    fi
fi
```

**find_path函数**
定义在/scripts/lupin-helpers文件中

find_path函数中，在除了ram,loop,fd的其他块设备中遍历查找iso-scan/filename参数指定的iso文件。
```
find_path()
{
    local path="${1}"
    # must match find_path_cleanup
    local default_mountpoint="${2:-/tmpmountpoint}"
    local mountoptions="${3:-ro}"
    local mountpoint=
    local dev devname devfstype
    local trial_number
    FOUNDDEV=
    FOUNDPATH=
    [ -z "${path}" ] && return 1
    wait_for_devs
    mkdir -p "${default_mountpoint}"
    for trial_number in 1 2 3; do
        [ $trial_number -gt 1 ] && sleep 3
        for sysblock in $(echo /sys/block/* | tr ' ' '\n' | grep -v /ram | grep -v /loop | grep -v /fd); do
            for dev in $(subdevices "${sysblock}"); do
                devname=$(sys2dev "${dev}")
                devfstype="$(get_fstype ${devname})"
                if is_supported_fs "${devfstype}" ; then
                                    #if device is already mounted, do not remount
                    if grep -q "^${devname} " /proc/mounts; then
                        mountpoint=$(grep "^${devname} " /proc/mounts|cut -d ' ' -f 2)
                        unmount=false
                    else
                        mountpoint="${default_mountpoint}"
                        try_mount "$devname" "$mountpoint" "$mountoptions" || continue
                        unmount=true
                    fi
                    if [ -e "${mountpoint}${path}" ]; then
                        FOUNDDEV="${devname}"
                        FOUNDPATH="${mountpoint}${path}"
                        return 0
                    fi
                    [ "${unmount}" = "true" ] && umount ${mountpoint} 2> /dev/null || true
                fi
            done
        done
    done
    return 1
}
```

**subdevices函数 sys2dev函数 get_fstype函数 is_supported_fs函数**均定义在/scripts/casper-helpers中
```
sys2dev() {
    sysdev=${1#/sys}
    echo "/dev/$(udevadm info -q name -p ${sysdev} 2>/dev/null|| echo ${sysdev##*/})"
}

subdevices() {
    sysblock=$1
    r=""
    # When booting off a "hybrid image" you can mount the whole device
    # or the first partition (which has offset 0). It's generally
    # better to mount the partition if we can so that we can mount
    # other partitions on the device (e.g. the persistence partition),
    # so try those first.
    for dev in "${sysblock}"/* "${sysblock}"; do
        if [ -e "${dev}/dev" ]; then
            r="${r} ${dev}"
        fi
    done
    echo ${r}
}

is_supported_fs () {
    # FIXME: do something better like the scan of supported filesystems
    fstype="${1}"
    case ${fstype} in
        vfat|iso9660|udf|ext2|ext3|ext4|btrfs|ntfs)
            return 0
            ;;
    esac
    return 1
}

get_fstype() {
    local FSTYPE
    local FSSIZE
    eval $(fstype < $1)
    if [ "$FSTYPE" != "unknown" ]; then
        echo $FSTYPE
        return 0
    fi
    /sbin/blkid -s TYPE -o value $1 2>/dev/null
}
```
