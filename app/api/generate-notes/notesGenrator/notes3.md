Here's a merged, clean, and complete Markdown document incorporating all your notes:

---

# File Systems Discussion Overview

*   **Context:**
    *   Two major assignments and two course projects focus on file systems.
    *   Previous discussions covered file system-related system calls (e.g., `open`, `read`, `write`, `close`).
    *   Today's focus is on the kernel details that enable file systems.
*   **Goal:** Provide a broad overview of file system interactions from an end-user perspective on a Linux system, addressing all related issues in one place.

# End-User Interaction with File Systems

*   **Common Activities:**
    *   Formatting disks.
    *   Mounting file systems.
    *   Accessing files.
    *   Working with special file types (e.g., device files, link files).

# Hardware Foundation: Hard Disks

## Physical Components of a Hard Disk

*   **Starting Point:** Discussion begins with the underlying hardware: hard disks, drivers, and controllers.
*   **Visual Aid:** Referenced a slide showing a physical hard disk and an abstract diagram.
*   **Key Components:**
    *   **Spindle:** A central axis around which the platters rotate.
    *   **Platters:** Multiple circular magnetic disks stacked on the spindle, where data is stored.
    *   **Arm Assembly:** Holds the magnetic heads.
    *   **Magnetic Heads:** Small read/write components that interact with the platters.
*   **Mechanism:**
    *   The platters rotate continuously around the spindle.
    *   The arm (and heads) can move radially across the platters (inside and outside) to access different data tracks.

## Data Organization on Hard Disks

*   **Sectors:**
    *   The magnetic disk surface is divided into small, individual sections called sectors.
    *   **Typical Size:** Historically and currently, a sector is typically 512 bytes.
    *   **Read/Write Unit:** The magnetic head reads or writes 512 bytes (one sector) at a time.
*   **Block Device:**
    *   Due to its operation on fixed-size data chunks, a disk is referred to as a "block device."
    *   A "physical block" on a disk is equivalent to a 512-byte sector.
*   **Cylinders:**
    *   A cylinder comprises all sectors located at the same radial position across all platters in the stack.
*   **Programming Perspective:** From a programming standpoint, the disk is seen as a block device where data is accessed sector by sector.

## Logical View of a Disk

*   The logical view of a disk is presented as a **sequence of blocks**.
*   The term "partition" will be introduced for further logical organization.
*   Loaders typically reside on a disk.

# Disk Controllers and Drivers

## Disk Controller

*   **Nature:** An electronic hardware circuit.
*   **Function:** It handles low-level instructions for the disk, such as "read block N" or "write block N."
*   **Execution:** These instructions are typically executed using `in` and `out` hardware instructions.
*   **Location:** The disk controller is a piece of hardware, often part of the motherboard assembly, acting as the interface between the physical disk and the electronic system.
*   **Role:** It bridges the physical and electronic worlds, abstracting mechanical details.
*   **Kernel Programmers' Perspective:** Kernel or C programmers often prefer not to deal with the intricate hardware-specific details of instructing the disk controller directly.

## Disk Drivers

*   **Functionality:**
    *   Disk companies create disk controllers.
    *   They write C code on top of these controllers, which forms the "disk driver."
    *   The primary job of a disk driver is to make the disk controller available to the operating system.
    *   It abstracts low-level hardware interactions and provides higher-level functions.
*   **Core Driver Functions:**
    *   `read(block_number, buffer)`: Reads the `nth` block from the disk into a specified `buffer`.
    *   `write(buffer, block_number)`: Writes data from a `buffer` into the `nth` block on the disk.
    *   These functions allow easy access to any block on the disk.

### Disk Driver Implementations (xv6 Examples)

*   **Bootloader (`bootmain`):**
    *   Includes a function called `read sector`.
    *   This was a disk driver that read the disk controller.
    *   It used **polling** for I/O because interrupts are typically disabled during the bootloader phase.
*   **Kernel (`id.c`):**
    *   `id` refers to a type of hard disk.
    *   This driver is found in the `id.c` file within the xv6 kernel.
    *   It features functions like `id read write` (a single function for both operations), `id start`, and `id interrupt` (the disk interrupt handler).
    *   This is an **interrupt-driven** disk driver, utilizing interrupts for I/O, unlike the polling method used in the bootloader.
    *   Reading `id.c` is encouraged to understand how a disk driver works.

### Q&A: Single Read/Write Function

*   **Question:** Why is there a single function for both read and write (`id read write`)?
*   **Answer:** The direction of transfer (read or write) can be passed as an argument to the function. Many other parameters communicated to the disk controller remain the same regardless of whether it's a read or write operation. Combining them avoids repeating the same code.

# Partitions

*   **Concept:** You are likely familiar with partitions from OS installation, dual-booting, etc.
*   **Definition:** Logical divisions of a hard disk. They are not physical breaks in the disk.
*   **Purpose:**
    *   To treat each division as if it were an independent sequence of blocks.
    *   For example, on Windows, `C:`, `E:`, `F:` drives are partitions, each starting its own block numbering from zero.
    *   Allows a large hard disk (e.g., 40GB) to be logically split into smaller, manageable chunks (e.g., 10GB, 20GB, 10GB).
*   *Note: The concept of primary partitions was mentioned but skipped for detailed explanation.*

# File System Concepts

## User's Perspective

*   **Appearance:** As programmers and users, we perceive a file system as an arrangement of files and folders.
*   **Structure:** It typically forms a tree-like structure:
    *   A top-level or "root" folder (e.g., `/` on Linux, `C:\` on Windows).
    *   Folders containing other folders and individual files.
*   **Path Names:** Files are accessed via complete path names (e.g., `C:\Users\John\Documents\report.docx`).
*   **The Problem:** The core challenge to solve is how to store this complex, logical tree structure, including file data, file names, and directory hierarchy, onto the physical disk.

## File System Fundamentals

### Storing File System Information

*   To store files and folders, the system needs to store:
    *   Information about files (properties, data blocks).
    *   Hierarchical relationships (folder ownership, parent-child links).
    *   The entire tree structure of the file system.
*   **Challenge**: Storing an N-array tree structure (representing files and directories) in a linear array of disk blocks (e.g., 512 bytes each).
    *   This is a core problem for kernel file systems, to be discussed in later lectures.

### Logical View of File Systems (Namespace)

*   **Namespace**: Refers to the collection of all names (files, folders) within a system.

#### Windows Namespace

*   **Forest View**: Windows presents a "forest" of file systems.
    *   Each partition (e.g., `C:`, `D:`) has its own independent tree structure.
    *   `C:` and `D:` appear unconnected logically.

#### Linux Namespace

*   **Single Tree View**: Linux presents a single, unified tree structure.
    *   There is one root folder (`/`).
    *   This single tree is maintained even with multiple storage devices or partitions through a concept called **mounting**.

### Mounting in Linux

*   **Concept**: Mounting allows incorporating a file system from another partition or storage device as a subtree into the main Linux file system tree.
*   **Process**:
    *   A tree from one partition/disk becomes accessible by being attached to an existing empty folder (a "mount point") within the main file system tree.
    *   Example: A separate disk's file system can be mounted at `/home/guest/mydir`.
*   **Access**: Files on the mounted partition are then accessed via paths rooted in the main tree (e.g., `/home/guest/mydir/x/v.cpp`).
    *   The `open` system call can use this unified path.
*   **Remote Mounting**:
    *   The concept extends to mounting file systems across a network.
    *   **Examples**: NFS (Network File System), CIFS, Nextcloud servers.
    *   Allows a computer to access files/folders hosted on another computer as if they were local.
    *   Provides a single terminal interface to access various types of files (local or remote).
*   **Lab Task**: A lab task will involve using Ubuntu virtual machines for remote mounting and other file system commands (like creating partitions).

# File Types

*   File types are indicated by the first character in the `ls -l` output.
*   **Directory**:
    *   Indicated by `d` (e.g., `d-rwxr-xr-x 2 guest guest 4096 ... feedback`).
*   **Regular File**:
    *   Indicated by `-` (hyphen) (e.g., `-rw-r--r-- 1 guest guest 1024 ... lab message.txt`).
*   **Named Pipe (FIFO)**:
    *   Indicated by `p` (e.g., `p-rw-rw-r-- 1 guest guest 0 ... /tmp/new`).
    *   A special file type for inter-process communication.
*   **Block Device File**:
    *   Indicated by `b` (e.g., `b-rw-r----- 1 root disk 259,0 ... /dev/nvme0n1`).
    *   Represents a physical block device (like an SSD or hard drive partition).
    *   Supports **block I/O**: data is read or written in fixed-size chunks (e.g., 512 bytes).
    *   Partitions are also represented as block device files (e.g., `/dev/nvme0n1p1`).

## Special Device Files

The kernel handles certain device files specially, not like normal files, due to their unique behaviors.

*   **`/dev/null`**
    *   **Purpose**: A data sink. Any data written to it is discarded, but the write operation succeeds.
    *   **Use Cases**: Getting rid of unwanted output from commands (e.g., redirecting standard output with `ls > /dev/null`), or running processes silently (`yes > /dev/null &`).
*   **`/dev/zero`**
    *   **Purpose**: A source of zeros.
    *   **Behavior**: When read from, it continuously returns zero bytes. Reads never "get over."
    *   **Use Cases**: Used to create files filled with zeros, such as `xv6.img` in the xv6 operating system.
*   **`/dev/random` and `/dev/urandom`**
    *   **Purpose**: Sources of random data.
    *   **Behavior**: When read from, they provide random bytes.
*   **`/dev/full`**
    *   **Purpose**: A file that always fails writes.
    *   **Behavior**: Any write operation to `/dev/full` will always fail.
    *   **Use Cases**: Useful for testing how applications handle "disk full" or write failure scenarios.
*   **Course Project Note:** Implementing such device files in xv6 is often part of course projects, as the existing code structure in xv6 makes it relatively straightforward to add new device files.

# File System Formatting and On-Disk Structures

## Formatting File Systems

*   **The Problem**:
    *   **Objective**: To store a pre-structured file system (directories, files, data, permissions) on a disk.
    *   **Disk Interface**: The disk, through its device driver, appears to the kernel as a simple sequence of blocks.
    *   **Kernel's Challenge**: The kernel must use the basic `read block` and `write block` interface provided by the device driver to manage and store complex file system structures.
*   **What is Formatting?**
    *   **Initial State of Disk**: A raw disk partition is initially an "uninitialized array" – it contains arbitrary, random data and no organized structure. It's practically useless for storing files.
    *   **Purpose of Formatting**: To create an *initialized* data structure on the disk partition. This structure allows the operating system to perform file system operations.
    *   **Analogies**:
        *   Similar to an array being useless without indices, a disk is useless without an organizing structure.
        *   It's like initializing a data structure (e.g., a binary tree with nodes and pointers) before it can be used.
    *   **Result**: After formatting, the partition has an initial, empty, or pre-defined tree-like structure (an "acyclic graph," as many file systems support links beyond simple trees), enabling the creation, deletion, and manipulation of files and folders.
*   **Implementation Considerations**:
    *   Just as binary trees can be implemented in various ways (e.g., using explicit node pointers or implicit array indices), file systems can have different internal organizational methods for managing their data structures on disk blocks.

## On-Disk Data Structures: File Systems

*   **Definition**: An on-disk data structure is called an "on-disk file system."
*   **Implementations/Formats**: Different ways of creating these structures are given names like:
    *   EXT4
    *   NTFS
    *   VFAT
    *   VXFS
*   **Function**: These are essentially different types of on-disk data structures.
*   **Formatting**: When a physical partition is "formatted," an empty file system (conceptually an empty tree) is created on it.
    *   The `MKFS` command is used for this purpose.

## Recap of File System Concepts (End User Perspective)

The lecture introduces remaining file system concepts, building on prior knowledge:

*   **End-User Interaction**: Users have already interacted with file systems by creating, deleting, and accessing files through:
    *   GUI (mouse and click)
    *   Command-line commands
    *   Programs using API calls like `open`, `read`, `write`, `close`.
*   **Physical Hard Disk**:
    *   Appears as a sequence of blocks to the programmer.
    *   Accessed via a disk controller and disk driver (e.g., `id.c` and `id.read` in XV6).
*   **Partition**:
    *   A logical division of a disk into chunks.
    *   Each chunk appears as its own sequence of blocks.
    *   The same device driver is used for partitions on a disk, as the driver logic doesn't change.
*   **Mounting**:
    *   A partition can be mounted onto an existing file system tree in another partition.
    *   This makes different partitions appear as a single, unified file system tree.
*   **Formatting**:
    *   The process of creating an initialized, empty file system on a given partition.
    *   Allows the partition to be used for storing data.
    *   **Crucial Step**: After formatting, a partition **must** be mounted to be accessible and usable.

# File System Operations Demonstration

A demonstration was performed to illustrate these concepts using a VirtualBox Ubuntu VM.

## Environment Setup

*   **Virtual Machine**: Ubuntu (old version, but functional).
*   **Hardware**: The VM has several extra virtual hard disks attached.

## Identifying Disks and Partitions

*   **GUI Method (`Disks` utility)**:
    *   Accessed via the activities menu.
    *   Shows all hard disks (e.g., 107GB, 11GB, 2GB disks).
    *   Displays device files (e.g., `/dev/sdc1` for a 2.1GB disk, `/dev/sdb` for an 11GB disk) and their partitions.
*   **Command Line Method (`cat /proc/partitions`)**:
    *   Displays all existing partitions on the system (ignoring `loop` and `DM` devices).
    *   Confirms the presence of `sdb` and `sdc` hard disks.
    *   **Note on Naming**: `S` in `SDB`, `SDC` stands for SATA (XV6 deals with IDE, which only requires a different device driver, kernel logic remains similar).

## Checking for Mounted Disks (`mount` command)

*   The `mount` command was used to list all currently mounted file systems.
*   This confirmed that `/dev/sdb` and `/dev/sdc` were not currently in use, making them suitable for modification.

## Deleting Existing Partitions (`fdisk` command)

*   **Target**: The `/dev/sdb` disk was chosen for demonstration.
*   **Command**: `sudo fdisk /dev/sdb`
*   **Steps**:
    1.  `p` (print): Displayed the existing partitions on `/dev/sdb` (e.g., `sdb1`, `sdb2`, `sdb3` with sizes 2GB, 4GB, 4GB).
    2.  `d` (delete): Deleted partitions one by one (e.g., `d 3`, `d 2`, `d 1`).
    3.  `p` (print): Confirmed that no partitions remained on `/dev/sdb`.
    4.  `w` (write): Wrote the changes (partition table alterations) from memory to the actual disk.
*   **Verification**:
    *   `cat /proc/partitions` was re-run.
    *   It showed that `sdb1`, `sdb2`, `sdb3` were no longer listed, confirming the disk is now in a "raw" state (without any partitions).

## Partitioning a Raw Disk (`fdisk`)

*   **Starting State**: Begin with a raw disk (e.g., `/dev/sdb`). `P` command confirms no existing partitions.
*   **Creating the First Partition**:
    *   Use `N` to create a new partition.
    *   Select "primary" type.
    *   Specify size using `+GB` notation (e.g., `+2GB`). The software intelligently handles existing data/partitions; confirm action.
    *   The first partition (e.g., `sdb1` - 2 GB) is created.
*   **Creating the Second Partition**:
    *   Use `N` again for a new partition.
    *   Select "primary" type.
    *   Press Enter to allocate all remaining space (e.g., `sdb2` - 8 GB).
*   **Viewing and Saving Partitions**:
    *   Use `P` to display the newly created partitions (2GB and 8GB).
    *   Use `W` to write (save) the partition data to the disk's boot sector. This action makes the partition data persistent and accessible.

## Creating File Systems (`mkfs`)

*   **Purpose**: To format the partitions with a specific file system type.
*   **Command Structure**: `mkfs -t <filesystem_type> <device_partition>`.
*   **Examples**:
    *   Create an `ext3` file system on `sdb1`: `mkfs -t ext3 /dev/sdb1`.
    *   Create an `ext2` file system on `sdb2`: `mkfs -t ext2 /dev/sdb2`.
*   **Result**: The two partitions now have empty file systems of different types (`ext3` and `ext2`).

## Mounting Partitions (`mount`)

*   **Purpose**: To access the contents of the file systems on the partitions.
*   **Mount Points**: Create empty directories as mount points (e.g., `mkdir /tmp_p1 /tmp_p2`).
*   **Mounting Command**: `mount /dev/sdb1 /tmp_p1`.
    *   Modern `mount` commands are intelligent and often auto-detect the file system type, although historically, specifying `-t` was required.
*   **Accessing Data**: Once mounted, the contents of the partition (e.g., `lost+found` directory created during formatting) are visible under the mount point.
    *   Files can be copied to the mounted partition (e.g., `sudo cp file.txt /tmp_p1/`). Permissions may require `sudo`.
*   **Unmounting Command**: `umount /dev/sdb1`.
    *   After unmounting, the mount point directory (`/tmp_p1`) becomes empty, and the partition's contents are no longer directly accessible via that path.

## Recap of Disk Operations

1.  **Partitioning**: `fdisk` (dividing disk space)
2.  **File System Creation**: `mkfs` (formatting partitions)
3.  **Mounting**: `mount` (making partitions accessible)

# File Types: Links

## Beyond Basic File Types

*   **Previously Covered**: Regular files, directories, storage devices (as files), named pipes (FIFO).
*   **New Problem Domains**: Creating cyclic graphs, exposing hardware devices as files, etc., necessitate new file types.

## The Concept of Links

*   **Motivation**: The need to access a single file using multiple names, similar to how a person might have an official name and nicknames.
*   **Goal**: Store data once, but allow it to be referenced by different names/paths.
*   **Types**: Hard links and Soft links (symbolic links).
*   **Command**: `LN` is used to create links. This concept is fundamental to understanding file systems like `ext2`.

## Understanding Hard Link Count

*   **`ls -l` Output Analysis**:
    *   The output of `ls -l` shows various file attributes: permissions, owner, group, size, modification time, and file name.
    *   **Link Count**: The field immediately after permissions is the **hard link count**.
*   **Meaning**: This number indicates how many hard links (names/paths) point to the same underlying file data.
*   **Example**: If `app.py` has a link count of `1`, it means that file data is currently referenced by only one name: `/home/abhijit/app.py`. The name is intrinsically tied to its location.

## File Linking Concepts

### Hard Links

Hard links provide multiple names for the same underlying file data.

*   **Creation:**
    *   Uses the `ln` command: `ln [source_file] [new_name]`
    *   Example: `ln app.py x.py` creates `x.py` as a hard link to `app.py`.
    *   Can create links in different directories: `ln ./app.py ./tmp/new.py`
*   **Characteristics and Behavior:**
    *   **Same Data:** All hard links point to the exact same file data. Modifying the content via any one link immediately reflects in all other links.
        *   *Example:* Editing `app.py` also updates `x.py` and `tmp/new.py` because they are the same file.
    *   **Link Count:** The `ls -l` command shows an increased "link count" for the file's inode.
        *   Initially, `app.py` has a link count of 1.
        *   After `ln app.py x.py`, the link count becomes 2.
        *   After `ln ./app.py ./tmp/new.py`, the link count becomes 3.
    *   **File Type:** All hard links appear as regular files (indicated by `-` in `ls -l`).
    *   **File Size:** All hard links show the same file size because they refer to the same data.
    *   **Path Names:** While they refer to the same data, they can have different path names and reside in different directories.
*   **Underlying Mechanism (Inodes):**
    *   **Separation of Data and Name:** File data on the hard disk is separate from the file's name.
    *   **Inode Role:** The "inode" is a data structure that stores metadata about a file, including:
        *   The *location* of the file's actual data blocks on the disk.
        *   The *link count* (number of names pointing to this inode).
    *   **Mapping:** There is a one-to-one mapping between an inode and a block of data.
    *   **Hard Link Logic:** A hard link creates a new directory entry (name) that points to an *existing inode*. Thus, multiple names can point to the same inode, which in turn points to the same data.

### Soft Links (Symbolic Links)

Soft links, also known as symbolic links, are a different type of link that creates a new, special file whose content is the path to another file.

*   **Creation:**
    *   Uses the `ln -s` command: `ln -s [target_file] [link_name]`
    *   Example: `ln -s ext2_FS.H my.H` creates `my.H` as a soft link to `ext2_FS.H`.
*   **Characteristics and Behavior:**
    *   **Different File Type:** Soft links are recognized as a special file type (indicated by `l` in `ls -l`).
    *   **Different Size:** The size of the soft link file is the number of characters in the *path name* of the target file, not the size of the target file itself.
        *   *Example:* If `ext2_FS.H` has a size of 18837 bytes, and its name has 9 characters, `my.H` will have a size of 9 bytes.
    *   **Indirection:** When a system call (like `open`) is made on a soft link, the operating system *resolves* the link, redirecting the operation to the actual target file.
        *   *Example:* Running `vi my.H` will open and display the content of `ext2_FS.H`. You are not reading the data of `my.H` (which is just the string "ext2_FS.H"), but the data of the file it points to.
    *   **Separate File:** Unlike hard links which share the same inode, a soft link is a completely new file with its own inode.
*   **Underlying Mechanism:**
    *   A soft link file stores the *path name* of its target file as its data.
    *   System calls are designed to interpret this path name and transparently access the actual target file.

### Key Differences and Core Concepts

*   **Hard Link:** Multiple directory entries (names) point to the *same inode*. The link count on the inode increases. They appear as regular files.
*   **Soft Link:** A new, special file whose data is the *path string* of the target file. It has its own inode and a distinct file type (`l`).
*   **Indirection:** Both linking mechanisms involve indirection (names to inode to data for hard links; soft link file content to target file for soft links).
*   **Influence:** The concept of hard and soft links significantly influences disk data structures and file system design.

# Advanced File System Operations and Networking

## Understanding `mv` with Special Files (`/dev/null`, `/dev/zero`)

*   **Initial Query**: The discussion starts with a question about moving a file into `/dev/null` or `/dev/zero` and its implications for deletion or data erasure.
*   **Purpose of Special Files**:
    *   `/dev/null`: Functions as a data "sink". `write` system calls on it will always succeed, effectively discarding any data written.
    *   `/dev/zero`: Functions as a "source of zeros". `read` system calls on it will always return a stream of zero bytes.
*   **Behavior of `mv` Command**:
    *   **Underlying System Call**: The `mv` command primarily uses the `unlink` system call to remove the target file, not `read` or `write`.
        *   `unlink` is the dedicated system call for deleting files.
        *   Files cannot be deleted using `open`, `read`, or `write` system calls.
    *   **`mv` Operation (Cut-Paste Analogy)**: The `mv` command behaves like a cut-paste operation with multiple possibilities:
        *   **Target File Does Not Exist**: It deletes the old (source) file and then creates a new file with the target name (often by renaming).
        *   **Target File Exists**: It deletes the old (source) file, deletes the existing target file, and then copies (or renames) the old file as the new target.
        *   **GUI vs. Command Line**: Graphical User Interfaces (GUIs) often provide an "overwrite" confirmation prompt when the target file exists. The `mv` command in the terminal does not typically do this by default, proceeding directly with the operation.
*   **Consequences of Overwriting `/dev/null`**:
    *   **Action Taken**: Executing `sudo mv /tmp/password /dev/null` overwrites the `/dev/null` special file with the contents of `/tmp/password`.
    *   **Impact on the System**:
        *   The original `/dev/null` (which is a character device acting as a data sink) is replaced by a regular file containing the moved file's data.
        *   This is considered a "nasty drastic thing" because `/dev/null` is a crucial system file, and its absence or incorrect type can lead to system malfunction.
        *   The operation was possible due to using `sudo` (root privileges).
    *   **Original File**: The `/tmp/password` file is moved, and its original location is empty. (The speaker clarifies that moving `/etc/password` would be far more disastrous than `/tmp/password`).
*   **Restoring `/dev/null`**:
    *   **Method**: To restore the `/dev/null` special file, the `mkNode` command must be used.
    *   **Information Needed**: `mkNode` requires specific major and minor device numbers for the file (e.g., 1 and 5 for `/dev/null`), which are typically hard to recall.
    *   **Easiest Solution**: Rebooting the system is the most straightforward way, as `/dev/null` is usually recreated during system startup.
*   **Special Nature of `/dev/null` and `/dev/zero`**:
    *   **Distinction**: These are "special files" because their `read` and `write` system calls exhibit unique and predefined behaviors that differ from those of regular files.

## Remote File System Mounting (NFS)

*   **User Question**: A new question arises regarding the `sudo mount` command for a remote file system.
*   **Setup Required**:
    *   A local computer (client) where the mount command will be executed.
    *   A remote computer (server) that is configured to share a specific folder (e.g., `/TMPD` with some data).
*   **Demonstration Prerequisite**: The speaker needs to set up a remote computer with a shared folder to effectively demonstrate the mounting process.

### NFS Setup Overview

The segment describes the process of setting up Network File System (NFS) to share a folder between two computers, one acting as a server and the other as a client.

#### NFS Server Configuration

*   **Installation:** The computer intended to share a folder must run an NFS server. The command `sudo apt install nfs-kernel-server` is used to install the necessary server software.
*   **Exporting File Systems:**
    *   **Configuration File:** The server uses the `/etc/exports` file to define which directories are shared.
    *   **Folder to Share:** An example folder `/TMPD` was used for sharing.
    *   **Access Control:** A `*` in the `/etc/exports` entry means the folder is accessible to any other computer.
    *   **Enabling the Share:** After modifying `/etc/exports`, the command `sudo exportfs -a` is run to apply the changes and enable the file system export.
        *   *Initial Error:* An "unknown keyword" error was encountered, suggesting a syntax mistake in the `/etc/exports` file.
        *   *Verification:* Running `exportfs` without arguments showed that `/TMPD` was correctly listed as shareable.
*   **Server Firewall Configuration:**
    *   The speaker uses `UFW` (Uncomplicated Firewall).
    *   Initially, NFS access was denied.
    *   The following commands were used to allow NFS traffic: `sudo ufw allow NFS`, `sudo ufw allow 111` (Port 111 is a known port for NFS).
    *   Despite these allowances, access issues persisted, suggesting further firewall or configuration problems.

#### NFS Client Configuration

*   **Installation:** The computer that will access the shared folder (the client) needs to install NFS client software. The command `sudo apt install nfs-common` is used for this purpose.
    *   *Initial Issue:* The mount command failed initially because `nfs-common` was not installed.
*   **Mounting the Remote Share:**
    *   **Server IP Address:** The client needs the IP address of the NFS server. In the example, the server's IP from the client's perspective (a VM) was `10.0.2.2`.
    *   **Local Mount Point:** A local directory on the client, such as `/tmp/NFS_mount`, is created to act as the mount point for the remote share.
    *   **Mount Command:** The command `sudo mount 10.0.2.2:/TMPD /tmp/NFS_mount` is used to mount the remote `/TMPD` folder onto the local `/tmp/NFS_mount` directory.
    *   *Persistent Mounts:* For automatic mounting on reboot, entries can be added to the `/etc/fstab` file on the client.

#### Troubleshooting and Challenges

*   Despite installing server/client software and configuring firewall rules, the direct attempt to mount the `/TMPD` share failed with "access is denied by the server."
*   The speaker acknowledges missing a step or specific firewall rule, possibly related to specific NFS ports or `etc/exports` options.
*   The process was undertaken after a long time, leading to forgotten details.

#### Successful NFS Example (Moodle/FOSS Servers)

To demonstrate a working NFS setup, the speaker showcased an existing configuration:

*   **Scenario:** A Moodle server's backup directory was mounted on a FOSS server.
*   **Persistent Configuration:** The mount was configured in the `/etc/fstab` file of the FOSS server for automatic mounting on reboot.
*   **Verification:**
    *   Executing `sudo mount /mnt/backup_Moodle` (a simplified command because it's in `fstab`) successfully mounted the remote share.
    *   Creating a file named `x` within the mounted `/mnt/backup_Moodle` directory on the FOSS server immediately showed up on the Moodle server, confirming the successful synchronization and access.

### Network Packet Issues and Demo Plan

*   **Network Packet Dropping:**
    *   **Problem Cause:** Packets are being dropped in the network due to numerous firewalls rejecting them.
    *   **Impact:** This prevents the intended functionality from working immediately.
*   **Demo Strategy in a LAN Environment:**
    *   **Ease of Execution:** It is much simpler to perform a demo in a local area network (LAN), such as a lab setting with two machines in close proximity.
    *   **Reason:** LAN environments typically bypass the wide-area network firewall issues that cause packet drops.
    *   **Action:** The planned demonstration will be conducted within a LAN setup.
*   **Current Session and Future Actions:**
    *   **Session Conclusion:** The current session is stopping.
    *   **Attendee's Next Step:** Attendees are instructed to proceed to their next class.
    *   **Future Demo:** A separate "NFL demo" will be prepared and presented later.

---