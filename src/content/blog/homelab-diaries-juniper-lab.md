---
title: "HomeLab Diaries: When the Lab Comes to You"
date: "2026-04-25"
excerpt: "A classmate needed to learn network automation. The university lab was unavailable. The cloud credits were gone. There was only one option left."
coverImage: "/assets/images/blog/juniper-lab-cover.png"
---

A classmate reached out asking if I could teach him some network automation. Simple enough request. The problem was the timing.

The physical Juniper equipment we had access to during my Network Automation course at the University of Maryland, part of the ENTS telecommunications program, was sitting in a lab on campus. Unavailable. That equipment was where I had first gotten hands-on with Juniper devices, and it would have been the obvious choice. But it was not an option.

So we had to get creative.

## The Options on the Table

When the physical lab is out, the next move is simulation or emulation. The popular choices for Juniper devices specifically are GNS3 and EVE-NG. Both can run vSRX images and both are capable platforms. We looked at a few paths:

**Option 1: GNS3 locally** with VMware, VirtualBox, or Hyper-V. Functional, but requires a reasonably capable machine and someone willing to set it up. My classmate came from a wireless background and was not enthusiastic about this. I do not blame him entirely. The setup overhead is real.

**Option 2: GNS3 on the cloud**; specifically GCP, which gives $300 in free credits for three months. I had actually done this before and it works well. You run the GNS3 server on a cloud VM and connect to it from the GNS3 desktop client on your local machine. There is a solid walkthrough [here](https://ronnievsmith.medium.com/gns3-network-simulator-on-google-cloud-platform-gcp-in-10-minutes-3ac7d6eced00) that I used when I first set it up. The catch: my credits were long gone, and I was not in the mood to spin up a new billing account. Also worth mentioning, in a GNS3 environment, NETCONF connectivity to Juniper devices typically runs over Telnet rather than SSH. That is not representative of how real network automation works in production, and it mattered for what we were trying to learn.

**Option 3: The Proxmox server.** Already running. Already sitting in my room. Within the capability.

There was really only one answer.

## Getting the Lab Ready

I already had the vSRX images from my time practising the network automation I learned in school. Getting them onto the Proxmox server was straightforward. SFTP through FileZilla from my ThinkPad to the Proxmox host. Simple, fast, and it keeps a clean transfer log if anything goes wrong.

The network side required four bridges:

- **vmbr0**: connects to the outside world, management network
- **vmbr1**: link between Router 1 and Router 2
- **vmbr2**: link between Router 2 and Router 3
- **vmbr3**: link between Router 1 and Router 3

This gives a full triangle topology. Every router has a direct link to every other router. Three routers, three links, with first OSPF Area 0 across all of them. It is the simplest topology that still demonstrates real routing behavior, and it fits comfortably within the hardware limits of the Dell Inspiron.

Speaking of limits, I did push it to four vSRX instances at one point and technically, it worked. The CPU hit nearly 100% and memory climbed above 86%. The host became sluggish enough to make automation workflows painful. Three is the number. Four is a lesson.

Once the VMs were up, each router was accessible from the Proxmox terminal using `qm terminal`. A few useful commands worth knowing if you are doing something similar:

```bash
qm start <vmid>     # start a VM
qm list             # list all VMs and their current state
qm terminal <vmid>  # open a serial console to the VM
```

For remote access, I use Tailscale. It gives the Proxmox host a stable IP that is reachable from anywhere without touching firewall rules or port forwarding. From there, a ProxyJump in `~/.ssh/config` lets me SSH directly to any router on the internal network from my ThinkPad in one hop.

## Where It Got Interesting

Setting up the VMs is the easy part. The interesting problems showed up once we tried to automate.

The goal was a full network automation workflow: Terraform to provision the infrastructure, Ansible to configure JunOS. This is closer to how real network automation works in production environments, and it is more useful to learn than drag-and-drop in a simulator.

**The bootstrap problem.** A freshly provisioned vSRX has no SSH user, no NETCONF service, and no management IP. Ansible cannot reach it until those basics are configured. This requires a manual step via the Proxmox serial console, applying a minimal bootstrap config to each router before automation can take over. It is a known reality in network automation. Even in production environments with Zero Touch Provisioning (ZTP) infrastructure, some form of initial bootstrap is required. In our case, that meant connecting to each router via `qm terminal` and pushing about six lines of JunOS config before handing things off to Ansible.

**NETCONF over ProxyCommand.** NETCONF is the protocol Ansible uses to talk to Juniper devices. It runs over SSH on port 830. The routers sit behind the Proxmox host, so every connection has to tunnel through it. Here is where things got subtle: the `ProxyJump` directive in `~/.ssh/config`, the modern, clean way to set up SSH jump hosts, is silently ignored by `ncclient`, the Python library that handles NETCONF under the hood. The older `ProxyCommand ssh -W %h:%p proxmox` syntax is what actually works. And the routers need to be referenced by hostname in the Ansible inventory, not by IP address. Using an IP bypasses `~/.ssh/config` entirely, which means no tunnel, which means a timeout with no helpful error message. That one took a while to track down.

**Security zones.** This is the detail that catches almost everyone coming from Cisco or Linux backgrounds. On a vSRX, the security zone policy applies to data plane interfaces even for management traffic. NETCONF sessions on `ge-0/0/x` interfaces require explicit `host-inbound-traffic` configuration within the security zone. Without it, NETCONF connections time out silently. The management interface (`fxp0`) sits outside the zone framework entirely and is controlled only by `system services`. Two different models, on the same device. Once you know this it makes sense. Before you know it, it looks like the connection is simply broken.

## The Automation Stack

Once the connectivity issues were sorted, the full pipeline came together cleanly.

**Terraform** handles infrastructure provisioning; bridges, VMs, disk imports, NIC assignments. The `bpg/proxmox` provider communicates with the Proxmox API over HTTPS and also requires SSH access to the host for disk operations. One quirk: the provider ignores `~/.ssh/config`, so the SSH address has to be specified explicitly in the provider configuration using the `node` block with the Tailscale IP.

**Ansible** handles JunOS configuration through three roles:

- `base`: hostname, NTP, DNS, security zone definitions
- `interfaces`: IP addressing, descriptions, zone assignments
- `ospf`: security policy, OSPF Area 0, passive loopback

The Ansible inventory is generated automatically by Terraform from a template, so running `terraform apply` produces a ready-to-use inventory file for the next step.

The full workflow:

```bash
# Step 1 - provision infrastructure
terraform apply

# Step 2 - bootstrap via console (one time per router)
qm terminal 211  # then apply minimal JunOS config

# Step 3 - configure everything
ansible-playbook -i inventory/hosts-tf.ini site-tf.yml
```

Both projects are on GitHub:

- [juniper-ospf-lab](https://github.com/Elikyals/juniper-ospf-lab) - the manual lab with Ansible automation
- [juniper-ospf-lab-ansible-terraform](https://github.com/Elikyals/juniper-ospf-lab-ansible-terraform) - the full Terraform + Ansible pipeline

## What It Taught Me

The honest answer is that teaching something forces you to understand it at a different level. Setting up the lab for a classmate meant thinking through every assumption I had made the first time around; why this bridge and not that one, why NETCONF and not CLI scraping, why ProxyCommand and not ProxyJump.

The Proxmox server continues to earn its keep. What started as a retired Dell Inspiron now runs a NAS, a Windows VM for the occasional thing that still requires Windows, and a Juniper network lab capable of teaching real automation workflows. Not bad for hardware that was almost a gaming rig.

Work with what you have.

*Part of the HomeLab Diaries series - documenting what I build on my Proxmox homelab.*
