# Emergency Dial Maco
**Simple emergency meeting start and answer macros for RoomOS devices.**

This is a proof-of-concept application that is intended to be used as a simple emergency meeting on a [RoomOS 11](https://help.webex.com/en-us/article/n01kjh1/New-user-experience-with-RoomOS-11).

<!--
<p align="center">
   <a href="https://app.vidcast.io/share/bb910329-f398-4f04-baec-18ddaf46f493" target="_blank">
       <img src="https://github.com/wxsd-sales/kiosk-reception-demo/assets/6129517/5e99058f-d4fd-4973-aaae-0d768f10837f" alt="kiosk-reception-demo"/>
    </a>
</p>-->

<!-- ⛔️ MD-MAGIC-EXAMPLE:START (TOC:collapse=true&collapseText=Click to expand) -->
<details>
<summary>Table of Contents (click to expand)</summary>

* [Overview](#overview)
* [Setup](#setup)
* [Demo](#demo)
* [Support](#support)

</details>
<!-- ⛔️ MD-MAGIC-EXAMPLE:END -->

## Overview

This application will create an instant meeting on a device, and automatically add other video devices in the org to the meeting, provided the other devices have had a bot added to their workspaces in [Control Hub](https://admin.webex.com).

## Setup

These instructions assume that you have administrator access to an Org's Webex Control Hub and a compatible RoomOS 11 device **in a shared workspace**.

1. Create a [Webex Bot Token](https://developer.webex.com/my-apps/new/bot) and [give it read access to the answering devices](https://developer.webex.com/docs/devices#giving-a-bot-or-user-access-to-the-xapi-of-a-device). Note the bot token somewhere safe.

2. Visit the org's [Control Hub device page](https://admin.webex.com/devices), choose the device placing the emergency dial and make the following changes using the "All configuration" link:
   - Set the value for `NetworkServices > HTTP > Mode` to `HTTP+HTTPS`

3. Apply the emergency-dial macro to the device that will be making the emergency meeting.  Edit the bot token field in the config of the macro with the bot token value you saved from step 1.
4. Apply the auto-answer macro to the answering devices.  Edit the AUTOANSWER_NUMBERS array to include the string value of the Spark.id of the device that will be creating the emergency meetings (found in the device's setting using the device's web UI.

## Demo

A video where we demo this PoC is available on Vidcast — TODO.

## Support

Please reach out to the WXSD team at [wxsd@external.cisco.com](mailto:wxsd@external.cisco.com?subject=Emergency%20Dial%20Macro).
