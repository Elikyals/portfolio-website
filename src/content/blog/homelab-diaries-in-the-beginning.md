---
title: "HomeLab Diaries: In the Beginning..."
date: "2026-04-24"
excerpt: "When I got my new ThinkPad, I had two options for the old Dell; gaming rig or homelab. I chose the one that would teach me more."
coverImage: "/assets/images/blog/proxmox-cover.jpeg"
---


### How I Turned My Old Dell Inspiron into the Base of My Homelab

It all began when I got a new rig; a Lenovo ThinkPad T16 Gen 4. The question of what to do with the old machine came up almost immediately. The honest first thought was gaming rig. The Dell Inspiron can probably still run old titles just fine, and there was something appealing about that. But I went with the second option: homelab.

I don't regret it.

## Setting Up Proxmox

Installing Proxmox on a laptop turned out to be more straightforward than I expected. There are plenty of walkthrough tutorials on YouTube, and the installation itself is not where the interesting problems live.

The trickiest part was network connectivity. Proxmox works best on ethernet. Proxmox over WIFI(WLAN) is nearly impossible to setup and my router is practically miles from my room. The solution was an ethernet cable run from a WiFi repeater to the laptop. Not elegant, but it works perfectly, and it taught me early that homelabs require creative problem solving. You work with what you have.


## What's Running on It Now

The homelab has grown steadily since that first install. Here's where it stands:

**3 Juniper vSRX routers** for network labs. Three is the highest number I could get running smoothly on this hardware; the Dell Inspiron has its limits. But three routers is enough to do real things: OSPF, routing policies, automation with Ansible and Terraform. It gets the job done.

**A Windows 11 VM** for the rare things that still require Windows. I moved to Fedora KDE Plasma as my daily driver some months back and have not looked back. But Windows occasionally comes up, and having it in a VM means I never have to think about it too hard.

**OpenMediaVault** - the latest addition. A network attached storage solution using two external hard drives I had lying around. The full story of that setup can be seen [here](https://eliyahukyalley.dev/blog/homelab-diaries-nas/). 

Next on the list is a Plex server for movies, hardware requirements permitting. Fingers crossed on that one.


## What Comes Next

I'm looking forward to expanding capacity, using multiple old laptops to try a Proxmox cluster, see how that works, and find out whether it holds up or falls apart spectacularly. Either way, something worth doing and of course documenting. More self-hosting is on the roadmap too, and dedicated hardware is the dream if circumstances allow.

But the bigger point is this: don't wait until you have beefy hardware before you start doing what you love. The Dell Inspiron is not a server. It has a dual-core i7, 16GB of RAM, and no redundancy of any kind. It is also one of the most valuable learning tools I have. The homelab is where theory becomes instinct, and that has been true from day one.

Work with what you have.

*Part of the HomeLab Diaries series - documenting what I build on my Proxmox homelab.*
