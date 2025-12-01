Here's the merged, clean, and complete Markdown document:

# File Systems: From Hardware to User Experience

This document compiles notes from a discussion on file systems, covering their underlying hardware, kernel implementation details, user interaction, and advanced concepts like links and remote mounting.

## 1. Introduction and Course Context

File systems are a foundational topic in this course, serving as the basis for two significant assignments and two course projects. Previous discussions touched upon file system-related system calls (`open`, `read`, `lseek`). Today's focus is on the kernel details that enable these file systems.

**User Activities with File Systems (Linux End-User Perspective):**
Common activities include:
*   Formatting disks.
*   Mounting file systems.
*   Accessing files.
*   Dealing with special files like device files and link files.

The goal is to address all file system-related issues comprehensively, starting with hardware.

## 2. Hard Disk Anatomy and Operation (Physical View)

The discussion begins with the hard disk, its drivers, and controllers.

### Key Components

*   **Spindle:** A central axis around which the platters rotate.
*   **Platters:** Multiple magnetic disks stacked on the spindle, where data is stored.
*   **Assembly/Arm:** A movable arm that holds the magnetic heads.
*   **Magnetic Heads:** Small components located on the arm, responsible for reading and writing data to the platters.

### Read/Write Mechanism

*   The platters rotate continuously around the spindle.
*   The magnetic heads remain stationary vertically but can move radially (inside and outside) across the platters' surface.

### Data Organization

*   **Sectors:** The magnetic disk surface is divided into small, individual sections called sectors.
    *   Historically and typically, a sector has a size of **512 bytes**.
*   **Block Device:** The disk is considered a "block device" because it reads and writes data in fixed-size chunks, specifically 512-byte physical blocks (sectors).
*   **Cylinder:** A conceptual term referring to all sectors at the same radial position across all platters.
*   From a programming perspective, the disk can be viewed as a block device where one sector can be read or written at a time.

## 3. Logical View of a Disk and Disk Controllers

For programmers, the disk is abstractly seen as a **sequence of blocks**. The term "partition" will be introduced and discussed later.

### Disk Controller

*   **Nature:** An electronic hardware circuit.
*   **Function:** Handles low-level instructions for the disk hardware, such as "read block number N" or "write to block number N," typically using in/out instructions.
*   **Location:** Part of the disk assembly, often integrated into a motherboard, and not easily visible in a typical diagram.
*   **Role:** Acts as the crucial boundary between the physical disk hardware and the electronic world, translating commands into physical actions.
*   Kernel and C programmers generally prefer not to deal with these exact low-level hardware instruction details.

## 4. Disk Drivers

Disk drivers are software components that provide an interface to the disk controller, abstracting low-level hardware interactions.

### Purpose and Functionality

*   Disk drivers typically offer functions for basic disk operations:
    *   `read(block_number, buffer)`: Reads the `nth` block from the disk into a specified `buffer`.
    *   `write(buffer, block_number)`: Writes data from a `buffer` to the `nth` block on the disk.
*   These functions abstract the low-level details of interacting with the disk hardware.
*   Disk drivers are often implemented in C code, written specifically for a given disk controller.

### Examples from xv6 Operating System

*   **Bootloader (`boot main`)**:
    *   Contains a function called `read sector`.
    *   This function acts as a disk driver, reading directly from the disk controller.
    *   It uses **polling** for I/O operations because interrupts are disabled during the bootloader phase.
*   **Kernel Code (`id.c`)**:
    *   `id` refers to an old type of hard disk.
    *   This file contains a more sophisticated disk driver for the `id` hard disk.
    *   Key functions include:
        *   `id read write`: A single function designed to handle both read and write operations, differentiating by an argument (e.g., direction of transfer).
        *   `id start`
        *   `id interrupt`: The disk interrupt handler.
    *   This driver is **interrupt-driven**, unlike the bootloader's polling mechanism.

### Design Choice: Single Read/Write Function

*   **Question**: Why use a single `id read write` function instead of separate `id read` and `id write`?
*   **Reason**: The primary difference between reading and writing is the direction of data transfer. Many other parameters and interactions with the disk controller remain identical. Combining them into one function avoids code duplication.

## 5. Partitions

### Concept of Partitioning

*   **Definition**: Logical divisions of a physical hard disk.
*   **Mechanism**: Partitions do not physically break the disk; they are software-defined separations.
*   **Functionality**: Each partition is treated as an independent sequence of blocks, starting from block number 0 within that partition (e.g., C: has blocks 0-X, E: has blocks 0-Y).
*   **Purpose**: Allows users to divide a single large hard disk into multiple smaller, manageable "drives" (e.g., C:, E:, F: drives on Windows).
*   **User Familiarity**: Assumes audience is already familiar with partitioning concepts from OS installations or dual-booting.

## 6. File Systems: User Perspective and Fundamentals

From a programmer's or user's perspective, a file system appears as an organized arrangement of files and folders, typically in a hierarchical **tree format**.

### How Users Perceive File Systems

*   **Components**:
    *   **Root Folder/Directory**: The topmost directory (e.g., `/` on Linux, `C:` or `D:` on Windows).
    *   Subfolders (directories within other directories).
    *   Files containing data.
*   **Addressing Files**: Files are accessed using complete path names (e.g., `C:\users\documents\report.docx`).

### The Underlying Problem

The core challenge for kernel file systems is **how to store this logical tree structure** (files, folders, their names, their data, and their relationships) efficiently and reliably onto the physical blocks of the disk. This involves storing:
*   File information (e.g., data blocks).
*   Folder hierarchy (parent-child relationships).
*   Properties of files and folders (metadata).

This information is stored linearly in a sequence of blocks on the disk. The problem is efficiently storing an N-array tree (representing the file system hierarchy) within a sequence of fixed-size blocks (e.g., 512 bytes each). This topic will be covered in later lectures.

### Logical View of File Systems: Windows vs. Linux

*   **Windows Namespace**:
    *   **Definition of Namespace**: A collection of all names (files, folders, drives).
    *   **Structure**: Windows uses separate trees for each partition (e.g., `C:`, `D:`).
    *   **Result**: This creates a "forest" – a collection of independent trees. Partitions appear disconnected from each other.

*   **Linux Logical View**:
    *   **Structure**: Linux primarily maintains a single tree structure, rooted at `/`.
    *   **Avoids a Forest**: It never becomes a "forest" due to the concept of **mounting**.

## 7. Mounting in Linux

### Purpose and Process

*   **Purpose**: Mounting allows a file system from a separate partition or device (which has its own tree structure) to be attached as a subtree to an existing folder within the main Linux file system tree.
*   **Process**:
    1.  A tree on a separate disk partition exists independently.
    2.  To make this partition accessible, its tree is connected to a specific folder (a "mount point") in the main file system.
    3.  The mounted subtree then appears as if it were a normal directory rooted at that mount point.
*   **Example**: If a partition's root is mounted to `/home/guest/mydir`, a file `v.cpp` within that mounted partition (originally at `/x/v.cpp` relative to its own root) becomes accessible via the path `/home/guest/mydir/x/v.cpp`.
*   **System Calls**: The `open` system call can access files using these combined path names.

### Remote Mounting

*   **Functionality**: Linux supports mounting file systems across a network, making remote folders or file systems appear as local.
*   **Protocols/Solutions**: Examples include NFS, CIFS, and Nextcloud (which can be mounted using standard Linux terminal commands).
*   **Advantage**: This provides a single, unified interface for accessing various types of files, regardless of their physical location (local or network).
*   **Lab Task**: Students will complete a lab involving Ubuntu virtual machines, remote mounting, and other file system commands.

## 8. Types of Files in Linux

The `ls -l` command shows detailed information, including the file type as the first character. Understanding these types is crucial for solving problems (e.g., cyclic graphs, hardware devices as files).

### Common File Types

*   **`d` - Directory**: Represents a folder (e.g., `mydir`, `feedback`).
*   **`-` - Regular File**: A standard data file (e.g., `lab_message.txt`).
*   **`p` - Named Pipe (FIFO)**: A special file used for inter-process communication (e.g., `mkfifo /tmp/new`).
*   **`b` - Block Device File**: Represents a block device like a hard disk, SSD, or partition (e.g., `/dev/nvme0n1`).
    *   **I/O**: Operations on block device files are performed in fixed-size blocks (e.g., 512 bytes), known as "block I/O."

### Special Device Files

The kernel handles certain "special device files" in a distinct way from normal files. These often represent hardware devices or specific kernel functionalities.

*   **`/dev/null` (Data Sink)**:
    *   **Purpose**: Discards any data written to it, but the write operation itself succeeds.
    *   **Use Cases**: Gets rid of unwanted output (e.g., `ls > /dev/null`), useful for background processes whose output is not desired (e.g., `yes > /dev/null &`).
*   **`/dev/zero` (Source of Zeros)**:
    *   **Purpose**: When read from, it continuously returns zero bytes.
    *   **Characteristics**: The read operation never finishes, always providing zeros.
    *   **Use Cases**: Used in contexts like creating `xv6.img` (xv6 disk image) to fill areas with zeros.
*   **`/dev/random` & `/dev/urandom` (Random Data Sources)**:
    *   **Purpose**: Provides random data when opened and read from.
*   **`/dev/full` (Always Fails Write)**:
    *   **Purpose**: Any write operation to this file will always fail.
    *   **Use Cases**: Useful for testing how an application handles situations where a disk is full or a write operation fails.

**Course Project in XV6:** Creating and supporting many such device files in XV6 is part of a course project. It's considered an easy task because the necessary code structure already exists, requiring only the addition of new files.

## 9. File System Formatting and On-Disk Structures

### Problem Definition

The goal is to store a structured file system (e.g., `/`, `/tmp`, folders, files, permissions) on a disk. The device driver presents the disk as a sequence of blocks, allowing only `read block` and `write block` operations. The challenge for the kernel is to use this block interface to organize and store all file system components (files, data, permissions, directories, file-folder relationships).

### Concept of Formatting

*   **Initial State**: When a disk partition is first used, it needs an initialized structure (e.g., an empty tree).
*   **Definition**: "Formatting" is the process of creating this initial, initialized tree structure on the partition.
*   **Purpose**: This initial structure allows subsequent file system operations like adding or deleting files/folders.
*   **Disk Partitions and Initialization**:
    *   A physical disk is divided into partitions (sometimes called slices).
    *   Disk partitions are accessed via a device driver.
    *   Initially, a partition contains arbitrary random data; it's like an "uninitialized array."
    *   Without organizing this raw block data, it's practically useless for storing a file system.

### Goal and Analogy

*   **Outcome of Formatting**: It creates an initialized data structure on the partition.
*   **Enabled Operations**: Allows creating files, deleting files, creating folders, writing to folders.
*   **Structure Created**: This structure is often an "acyclic graph," not just a simple tree, as many modern file systems allow more complex linking.
*   **Implementation Analogy**: Similar to implementing data structures like binary trees:
    *   Can be done using nodes with explicit pointers (left/right).
    *   Can also be done using an array with implicit or explicit indices, linking elements within the array.
    *   Various ways exist to organize the disk's data structure.

### On-Disk Data Structures (File Systems)

*   **Definition:** On-disk data structures used to organize and store data are called file systems (or on-disk file systems).
*   **Variations:** Different implementations of these data structures exist, each with unique formats and names.
    *   **Examples:** EXT4, NTFS, VFAT, VXFS.
*   **Formatting:** The process of "formatting a physical partition" involves creating an empty, initialized file system (often conceptualized as an empty tree structure) on that partition.

## 10. Disk Management and File System Operations Demo

The instructor demonstrated how to prepare a disk, create file systems, and manage them.

### Recap of File System Concepts (End-User Perspective)

The lecture reviewed concepts, introducing them from an end-user perspective, even for those who use programming APIs (`open`, `read`, `write`, `close`).
*   **Physical Hard Disk:** Appears to the programmer as a sequence of blocks, accessed via a disk controller and a disk driver (e.g., `id.c` and `id.read` in XP6).
*   **Partition:** A logical division of a physical disk into chunks. Each chunk appears as an independent sequence of blocks. The same device driver is used for partitions on a disk, as partitioning does not change the driver's logic.
*   **Mounting:** The process of attaching a partition's file system onto an existing file system tree (often from another partition). This makes multiple file systems appear as a single, unified tree structure.
*   **Formatting:** Creating an initialized, empty file system on a given partition. This makes the partition usable for storing files. After formatting, the partition **must be mounted** to be accessible and used.

### Demonstration: Preparing a Raw Disk using `fdisk`

**Demonstration Setup:**
*   VirtualBox environment running an Ubuntu virtual machine.
*   The VM was configured with additional virtual hard disks (e.g., 2GB, 11GB).

**Identifying Disks and Partitions:**
*   **GUI Method:** Using the "Disks" application in Ubuntu to visually inspect hard disks and their partitions (e.g., `/dev/sdc1`, `/dev/sdb1`, `/dev/sdb2`, `/dev/sdb3`).
*   **CLI Method:** Examining the `/proc/partitions` file, which lists all existing partitions (e.g., `sdb`, `sdc`, ignoring loop and DM devices).
*   **Disk Type:** Noted that `sdb`, `sdc` indicate SATA disks, while XV6 typically uses IDE (difference only in device driver).

**Checking Current Mounts:**
*   Used the `mount` command to ensure that the target disks (`/dev/sdb`, `/dev/sdc`) were not currently mounted. This is crucial before modifying partition tables.

**Deleting Partitions with `fdisk`:**
*   **Command:** `sudo fdisk /dev/sdb` (targeting the 11GB hard disk).
*   **Print Partitions (`p`):** Showed three existing partitions (`sdb1`, `sdb2`, `sdb3`) on `/dev/sdb`.
*   **Delete Partitions (`d`):** Used `d` followed by the partition number to delete all existing partitions (e.g., `d 3`, `d 2`, `d 1`).
*   **Verify Deletion (`p`):** Confirmed no partitions were listed after deletion.
*   **Write Changes (`w`):** Saved the changes to the disk's partition table. These operations are initially in memory and only persist after writing.
*   **Post-Deletion Verification:** Checked `/proc/partitions` again, confirming that `sdb1`, `sdb2`, `sdb3` were no longer listed.
*   **Result:** The disk `/dev/sdb` was successfully made into a "raw" disk, ready for new partitioning and formatting.

### Disk Partitioning (`fdisk`)

**Starting Point:** A raw disk with no existing partitions.
*   **Creating a New Partition**:
    *   Use `n` to create a new partition.
    *   **Type**: Choose `primary` or `extended`.
    *   **Size Specification**: Can use sector numbers or human-readable notations (e.g., `+2GB`).
    *   **Example**: Create a 2GB primary partition.
    *   **Second Partition**: Create another primary partition using the remaining space by just pressing Enter.
*   **Viewing Partitions**: Use `p` to display the created partitions (e.g., 2GB and 8GB).
*   **Saving Changes**: Use `w` to write the partition data to the disk. Partition data is typically saved in the boot sector.

### File System Creation (`mkfs`)

*   **Purpose**: To create an empty file system on a partition.
*   **Command**: `mkfs -t <filesystem_type> <device_name>`
*   **Examples**:
    *   `mkfs -t ext3 /dev/sdb1`: Creates an `ext3` file system on the first partition.
    *   `mkfs -t ext2 /dev/sdb2`: Creates an `ext2` file system on the second partition.
*   **Result**: Partitions now have empty file systems of specified types (`ext2` and `ext3`).

### Mounting and Accessing Partitions

*   **Purpose**: To make partitions accessible as part of the file system hierarchy.
*   **Requirement**: A folder (mount point) is needed to mount the partition.
*   **Creating Mount Points**: Example: `mkdir /tmp/p1 /tmp/p2`.
*   **Mounting Command**: `mount /dev/sdb1 /tmp/p1`
    *   Modern `mount` commands are intelligent and often detect the file system type automatically. Historically, `-t` option was often required.
*   **Accessing Mounted Partition**:
    *   Once mounted, the contents of the partition are visible within the mount point folder.
    *   `lost+found` directory is part of the formatting process and appears after mounting.
    *   Files can be copied to the mounted partition (e.g., `sudo cp <file> /tmp/p1`). Permissions often require `sudo`.
*   **Unmounting Command**: `umount /tmp/p1`
    *   Removes access to the partition; the mount point folder becomes empty again.
*   **Summary of Steps**:
    1.  `fdisk`: Partitioning the disk.
    2.  `mkfs`: Creating a file system on partitions.
    3.  `mount`/`umount`: Making partitions accessible/inaccessible.

## 11. File Links: Hard and Soft

### Concept of Links

The motivation for links is the need to access one file using multiple names (similar to real-life individuals having multiple names). The goal is to have a single file (data stored once) accessible via different names. There are two types: Hard links and Soft (symbolic) links.

### Understanding Hard Link Count (`ls -l` Output)

The `ls -l` command is used to display detailed information about files. Its output components include:
*   Permissions
*   **Link Count (Hard Link Count)**: The numerical field after permissions and before owner/group.
    *   Indicates how many hard links (names) point to the same underlying file data.
*   Owner
*   Group
*   File size
*   Last modification time
*   File name

**Example**: If `app.py` has a link count of `1`, it means it currently has only one name (the specified path `slash home slash abhijit slash app.py`).

### Hard Links

*   **Creation**:
    *   Created using the `ln` command (e.g., `ln ./app.py x.py`).
    *   Allows creating multiple names (path names) for a single file's data.
*   **Characteristics**:
    *   When a hard link is created, the "link count" associated with the file's data increases (e.g., from 1 to 2, then to 3).
    *   All hard links to the same file data will show identical details in `ls -l` output (permissions, owner, group, size, timestamp), except for their names/paths.
    *   They are all regular files (indicated by `-` in `ls -l`).
    *   Hard links can exist in different directories (e.g., `tmp/new.py` linking to `app.py`).
*   **Modification**:
    *   Modifying the content of one hard link (e.g., `app.py`) immediately reflects the changes in all other hard links (e.g., `x.py`, `new.py`), because they all refer to the *same underlying file data*.
    *   The file size increases uniformly across all links if content is added.

### Soft Links (Symbolic Links)

*   **Creation**:
    *   Created using the `ln -s` command (e.g., `ln -s ext2_FS.H my.H`).
*   **Characteristics**:
    *   A soft link is a new type of file, denoted by `l` in the `ls -l` output.
    *   It has a different size compared to the original file it points to.
        *   The size of the soft link file is equal to the number of characters in the *path name* of the target file.
        *   For example, if `ext2_FS.H` has 9 characters, `my.H` (the soft link) will have a size of 9 bytes.
*   **Data Content**:
    *   The "data" of a soft link file is not the original file's content, but rather the *path name* of the actual file it links to.
*   **Access**:
    *   When a system call (like `open`) is made on a soft link (e.g., `vi my.H`), it resolves to the actual target file (e.g., `ext2_FS.H`).
    *   This provides an indirect way of accessing the content of the target file.

### Underlying Mechanism: Inodes

*   **Separation of Data and Name**: When a file is stored on a hard disk, the actual file data is conceptually separated from its name.
*   **Role of Inodes**: An "inode" is a data structure that stores crucial information about a file, including the location of its data on the disk and its link count. There is a one-to-one mapping between an inode and the file's data.
*   **Hard Links and Inodes**: Hard links are names that provide direct access to an inode. Multiple hard links pointing to the same inode means all those names access the identical file data through that single inode. The inode is where the "link count" is stored, reflecting how many hard links point to it.
*   **Soft Links and Inodes**: A soft link is a *new file* that contains the path name of the original file as its data. It does not directly point to the original file's inode in the same way a hard link does.

The concepts of hard and soft links are fundamental to how disk data structures and file systems are designed. Their specific uses will be discussed further.

## 12. Understanding `mv` with Special Files like `/dev/null`

This section clarifies what happens when the `mv` command is used with special device files.

### Initial Query and Clarification

*   **Question**: What happens if a file is moved (`mv`) into `/dev/null` or `/dev/zero`? Will the data be erased?
*   **Special File Behavior**:
    *   `/dev/null` is a "sink": `write` system calls on it will always succeed but discard all data.
    *   `/dev/zero` is a "source of zeros": `read` system calls on it will always return zeros.

### Mechanism of the `mv` Command

*   The `mv` command uses the `unlink` system call to remove files.
*   `unlink` is a system call specifically for deleting a file, not for reading from or writing to it.
*   Therefore, `mv` does not interact with the read/write behavior of special files in the way one might expect for data "erasure" via a sink.

### Consequences of Overwriting `/dev/null`

*   **Action**: Executing a command like `sudo mv /tmp/password /dev/null`.
*   **Result**: The special file `/dev/null` is *overwritten* by the content of `/tmp/password`.
*   **Impact**:
    *   The system loses its original `/dev/null` functionality (i.e., it's no longer a data sink).
    *   The `mv` command effectively replaces the device file with a regular file containing the moved data.
    *   This is considered a "nasty drastic thing" if done as the root user (`sudo`) without understanding the implications.
*   **Restoration of `/dev/null`**:
    *   **`mkNode` command**: `/dev/null` can be recreated using `mkNode`, which requires specific major and minor device numbers (e.g., 1 and 5 for `/dev/null`). These numbers are often not remembered by users.
    *   **Reboot**: Rebooting the system is a common way to automatically recreate essential device files like `/dev/null`.

### The `mv` (Cut-Paste) Operation

*   The `mv` command essentially performs a "cut-paste" operation.
*   **Process**: It deletes the target file (if it exists) and then creates a new file at the target location using the source's content or inode (depending on whether it's moving across filesystems or within the same).
*   **Multiple Possibilities**:
    *   If the target filename does not exist: It deletes the old source file and creates a new file at the target.
    *   If the target filename already exists: It deletes the old target file, then effectively moves (or copies and deletes) the source file to become the new target.
*   **GUI vs. Command Line**: GUI cut-paste operations often prompt the user before overwriting an existing target file, whereas the command-line `mv` tool does not by default (it just overwrites).

### Special Nature of `/dev/null` and `/dev/zero`

These files are deemed "special" because their `read` and `write` system calls exhibit unique and non-standard behaviors compared to regular files.

## 13. Mounting a Remote File System (NFS)

This section details accessing a file system located on a different computer using NFS (Network File System).

### Introduction to Remote File System Access

*   **Goal**: To access a file system located on a different computer.
*   **Requirements**:
    *   **Client Computer**: The computer initiating the access.
    *   **Server Computer**: A remote computer that is configured to share one of its folders.
*   **Example Scenario**: A local computer wants to access a folder (e.g., `TMPD`) located on a laptop (remote computer). The laptop must explicitly share the `TMPD` folder for the client to access it.

### NFS Server Configuration

1.  **Installation**:
    *   The server computer, responsible for sharing a folder, needs to run the NFS server.
    *   Installation command: `sudo apt install nfs-kernel-server`

2.  **Exporting a Folder (`/etc/exports`)**:
    *   The file `/etc/exports` is used to specify which file systems to share.
    *   **Syntax**: `[Folder_Path] [Client_IP_or_Hostname](options)`
    *   **Example**: To share `/tmp/d` with any computer: `/tmp/d *(rw,sync,no_subtree_check)`
        *   `*`: Allows access from any client.
        *   Options like `rw` (read/write), `sync` (synchronous writes), `no_subtree_check` are common.

3.  **Enabling the Share**:
    *   After modifying `/etc/exports`, run `sudo exportfs -a` to make the changes effective.
    *   Verify exported shares with `exportfs`.

### NFS Client Configuration

1.  **Identifying Server IP**:
    *   The client needs the IP address of the NFS server.
    *   In the example, the server's IP was `10.0.2.2` (host machine) and the client (VM) had `10.0.2.15`.

2.  **Installing Client Software**:
    *   The client computer needs the NFS common utilities.
    *   Installation command: `sudo apt install nfs-common`

3.  **Mounting the Share**:
    *   Create a local mount point (e.g., `/tmp/nfs_mount`).
    *   **Mount Command**: `sudo mount [Server_IP]:[Server_Shared_Path] [Client_Mount_Point]`
    *   **Example**: `sudo mount 10.0.2.2:/tmp/d /tmp/nfs_mount`

### Troubleshooting NFS Mount Issues (Demonstration Notes)

During the live demonstration, several issues were encountered:

1.  **"Access Denied by the Server"**: This was the initial error when attempting to mount the share.
2.  **Firewall Configuration (`UFW`)**:
    *   The server's firewall (UFW) was suspected of blocking NFS traffic.
    *   **Actions Taken**:
        *   `sudo ufw allow NFS` (to allow default NFS ports)
        *   `sudo ufw allow 111` (to specifically allow port 111, often used by `rpcbind` for NFS).
    *   Despite these, the "access denied" error persisted, indicating other firewall rules or configuration steps might be missing.

### Successful NFS Mount Example

To illustrate a working setup, a pre-existing NFS mount between a Moodle server and a FOSS server was demonstrated:

1.  **Persistent Mounts with `/etc/fstab`**:
    *   The file `/etc/fstab` is used to configure file systems to be mounted automatically at boot.
    *   **Example Entry**: `[Server_IP]:[Server_Shared_Path] [Client_Mount_Point] nfs defaults 0 0`
    *   This configuration allowed mounting a remote `/mnt/backup_moodle` folder from a server onto a local `/mnt/backup_moodle` directory on the client.

2.  **Demonstrating Shared Access**:
    *   After mounting (using `sudo mount /mnt/backup_moodle` due to `/etc/fstab` entry), content in the shared folder on the client was verified to be identical to the server.
    *   A new file `x` was created on the mounted client folder, and it immediately appeared on the server's shared folder, demonstrating successful read/write access.

### Further Troubleshooting Attempts (Demonstration Notes)

*   The presenter acknowledged missing a step, possibly related to more granular firewall settings or NFS options.
*   An attempt was made to simplify the server's `/etc/exports` by setting the shared folder (`/backup_moodle`) to export to `*` (the entire world) on a different server (FOSS server) to bypass potential IP restrictions.
*   A subsequent mount attempt on a different IP (`172.16.x.x`) for the `/backup_moodle` folder still resulted in delays, suggesting potential network or configuration issues persist.
*   The presenter indicated that the full demonstration would be completed in a separate lab session.

## 14. Network Challenges and Conclusion

### Network Challenges & Lab Setup

*   **Packet Dropping Issues**: Packets are being dropped in the network, attributed to numerous firewalls globally. This issue prevented immediate success during the live demonstration.
*   **Ease of Lab Implementation (LAN Environment)**: The task is very easy to perform in a controlled lab environment with two machines in a Local Area Network (LAN), which will be used for future demos to avoid wider network issues.

### Upcoming Demonstration

A specific "NFL demo" will be prepared and conducted separately.

### Class Conclusion

The current session concluded with instructions for students to proceed to their next class. A "Control C" command was executed, indicating the termination of a process or session.