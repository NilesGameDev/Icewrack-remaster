"use strict";

var WINDOW_OPTION_SPLIT = 1;
var WINDOW_OPTION_PARTY = 2;
var WINDOW_OPTION_TRADE = 4;

function OnWindowFocus(hContextPanel, tArgs)
{
	if (hContextPanel.GetParent().GetParent() == GameUI.GetWindowRoot())
	{
		var hWindowRoot = GameUI.GetWindowRoot();
		var tSiblings = hWindowRoot.Children();
		for (var k in tSiblings)
		{
			if (tSiblings[k] !== hContextPanel.GetParent())
			{
				hWindowRoot.MoveChildBefore(tSiblings[k], hContextPanel.GetParent());
			}
		}
	}
	hContextPanel.SetFocus();
}

function OnWindowChangePartyMember(hContextPanel, nOffset)
{
	var hHeaderPanel = hContextPanel.FindChild("WindowHeaderPanel");
	if (hHeaderPanel)
	{
		var nEntityIndex = hContextPanel.GetAttributeInt("entindex", -1);
		var tPartyMembers = CustomNetTables.GetTableValue("party", "Members");
		
		var nActiveSlots = 0;
		var nPartySize = 0;
		var nTargetSlot = 0;
		for (var k in tPartyMembers)
		{
			var nSlot = parseInt(k) - 1;
			var nMemberIndex = parseInt(tPartyMembers[k]);
			nPartySize++;
			if (nMemberIndex == nEntityIndex)
			{
				nTargetSlot = nSlot + nOffset;
			}
		}
		nTargetSlot = (nTargetSlot <= 0) ? nTargetSlot + nPartySize : nTargetSlot;
		nTargetSlot = nTargetSlot % nPartySize;
		
		var nTargetCount = 0;
		var nLastTargetCount = 0;
		do
		{
			nLastTargetCount = nTargetCount;
			for (var i = 1; i <= nPartySize; i++)
			{
				var nMemberIndex = tPartyMembers[i + ""];
				if (Entities.IsAlive(nMemberIndex) && !Entities.HasItemInInventory(nMemberIndex, "internal_corpse"))
				{
					if (nTargetCount === nTargetSlot)
					{
						var hTitleText = hHeaderPanel.FindChildTraverse("NameTitle");
						if (!hTitleText)
						{
							hTitleText = hHeaderPanel.FindChildTraverse("RightNameTitle");
						}
						hContextPanel.SetAttributeInt("entindex", nMemberIndex);
						hTitleText.text = $.Localize("#" + Entities.GetUnitName(nMemberIndex));
						DispatchCustomEvent(hContextPanel, "WindowPartyUpdate", { entindex:nMemberIndex });
						return;
					}
					nTargetCount++;
				}
			}
		}
		while (nTargetCount !== nLastTargetCount);
	}
}

function OnWindowDragMove()
{
	var hPanel = $.GetContextPanel()._hDragPanel;
	var vCursorPosition = GameUI.GetCursorPosition();
	var fDeltaX = (vCursorPosition[0] - hPanel._vDragStart[0]) * GameUI.GetScaleRatio();
	var fDeltaY = (vCursorPosition[1] - hPanel._vDragStart[1]) * GameUI.GetScaleRatio();
	hPanel.style.position = (hPanel._fOffsetX + fDeltaX) + "px " + (hPanel._fOffsetY + fDeltaY) + "px 0px";
	if (hPanel._bIsDragging)
	{
		$.Schedule(0.03, OnWindowDragMove);
	}
	else
	{
		hPanel._fOffsetX = hPanel._fOffsetX + fDeltaX;
		hPanel._fOffsetY = hPanel._fOffsetY + fDeltaY;
	}
}

function OnWindowDragStart(szPanelID, hDraggedPanel)
{
	if (!GameUI.IsMouseDown(0))
		return true;
	
	var hPanel = $.GetContextPanel();
	if (szPanelID !== hPanel.id)
		hPanel = hPanel.FindChildTraverse(szPanelID);
	
	DispatchCustomEvent(hPanel, "WindowFocus");
	hPanel._vDragStart = GameUI.GetCursorPosition();
	hPanel._bIsDragging = true;
	
	$.GetContextPanel()._hDragPanel = hPanel;
	$.Schedule(0.03, OnWindowDragMove);
	
	var hDummyPanel = $.CreatePanel("Panel", hPanel, "DummyPanel");
	hDraggedPanel.displayPanel = hDummyPanel;
	return true;
}

function OnWindowDragEnd(szPanelID, hDraggedPanel)
{
	var hPanel = $.GetContextPanel()._hDragPanel;
	hDraggedPanel.DeleteAsync(0);
	hPanel._bIsDragging = false;
	hPanel.SetFocus();
	return true;
}

function OnWindowOpen(hContextPanel, tArgs)
{
	if (hContextPanel._bInputLock === false)
	{
		hContextPanel._bInputLock = true
		hContextPanel.AddClass("WindowFadeIn");
		hContextPanel.RemoveClass("WindowFadeOut");
		hContextPanel.SetFocus();
		hContextPanel.visible = true;
		hContextPanel._fOffsetX = 0;
		hContextPanel._fOffsetY = 0;
		hContextPanel.style.position = "0px 0px 0px";
		OnWindowChangePartyMember(hContextPanel, 0);
		DispatchCustomEvent(hContextPanel, "WindowFocus");
		hContextPanel._bRealVisible = true;
		hContextPanel._bInputLock = false
	}
	else
	{
		return true;
	}
}

function OnWindowClose(hContextPanel, tArgs)
{
	if (hContextPanel._bInputLock === false)
	{
		hContextPanel._bInputLock = true
		hContextPanel.AddClass("WindowFadeOut");
		hContextPanel.RemoveClass("WindowFadeIn");
		$.Schedule(0.25, function() { hContextPanel.visible = false; hContextPanel._bInputLock = false; });
		
		var hWindowRoot = GameUI.GetWindowRoot();
		if (hContextPanel.GetParent().GetParent() == hWindowRoot)
		{
			var tSiblings = hWindowRoot.Children();
			for (var i = tSiblings.length-1; i >= 0; i--)
			{
				var hWindow = tSiblings[i]._hWindowPanel;
				if ((hWindow) && (hWindow._bRealVisible) && (hWindow !== hContextPanel))
				{
					DispatchCustomEvent(hWindow, "WindowFocus");
					hWindowRoot.MoveChildBefore(tSiblings[i], hContextPanel.GetParent());
					break;
				}
				else if (i === 0)
				{
					//Return focus to the main game
					var hDummyPanel = $.CreatePanel("Panel", hWindowRoot, "DummyFocusPanel");
					hDummyPanel.SetAcceptsFocus(true);
					hDummyPanel.SetFocus();
					hDummyPanel.DeleteAsync(0.03);
				}
			}
		}
		hContextPanel._bRealVisible = false;
		
	}
	else
	{
		return true;
	}
}

function OnWindowToggle(hContextPanel, tArgs)
{
	var szEventName = hContextPanel.visible ? "WindowClose" : "WindowOpen";
	DispatchCustomEvent(hContextPanel, szEventName);
	return true;
}

function OnWindowTabForward(hContextPanel, tArgs)
{
	OnWindowChangePartyMember(hContextPanel, 1);
}

function OnWindowTabBackward(hContextPanel, tArgs)
{
	OnWindowChangePartyMember(hContextPanel, -1);
}

function OnWindowButtonActivate(hContextPanel, tArgs)
{
	var szPanelID = tArgs.panel.id;
	if (szPanelID === "WindowCloseButton")
		DispatchCustomEvent(hContextPanel, "WindowClose");
	else if (szPanelID === "WindowLeftButton")
		DispatchCustomEvent(hContextPanel, "WindowTabBackward");
	else if (szPanelID === "WindowRightButton")
		DispatchCustomEvent(hContextPanel, "WindowTabForward");
}

function OnWindowMenuOption(args)
{
	if (!GameUI.IsHidden())
	{
		if (args.name === $.GetContextPanel()._szInternalName)
		{
			DispatchCustomEvent($.GetContextPanel(), "WindowToggle");
		}
	}
}

function OnWindowLoad()
{
	GameEvents.Subscribe("iw_menu_option", OnWindowMenuOption);
	
	$.RegisterEventHandler("DragStart", $.GetContextPanel(), OnWindowDragStart);
	$.RegisterEventHandler("DragEnd", $.GetContextPanel(), OnWindowDragEnd);
}

function CreateWindowPanel(hParent, szName, szInternalName, szTitle, nOptionsMask)
{
	hParent.SetParent(GameUI.GetWindowRoot());
	var hPanel = $.CreatePanel("Panel", hParent, szName);
	hPanel.BLoadLayout("file://{resources}/layout/custom_game/ui/iw_window.xml", false, false);
	hPanel.FindChildTraverse("Title").text = $.Localize(szTitle);
	hPanel.SetAttributeInt("options", nOptionsMask);
	hPanel._szInternalName = szInternalName;
	hPanel._fOffsetX = 0;
	hPanel._fOffsetY = 0;
	hPanel._bInputLock = false;
	hParent._hWindowPanel = hPanel;
	
	var hCloseButton = CreateButton(hPanel, "WindowCloseButton", null, "ui/window/iw_window_close_button");
	
	var hWindowBody = hPanel.FindChild("Body");
	if (nOptionsMask & WINDOW_OPTION_SPLIT)
	{
		hWindowBody.BLoadLayout("file://{resources}/layout/custom_game/ui/iw_window_layout_split.xml", false, false);
	}
	else
	{
		hWindowBody.BLoadLayout("file://{resources}/layout/custom_game/ui/iw_window_layout_full.xml", false, false);
	}
	
	var nHeaderMask = nOptionsMask & (WINDOW_OPTION_PARTY | WINDOW_OPTION_TRADE);
	if (nHeaderMask === WINDOW_OPTION_PARTY)
	{
		var hHeaderPanel = $.CreatePanel("Panel", hPanel, "WindowHeaderPanel");
		hHeaderPanel.BLoadLayout("file://{resources}/layout/custom_game/ui/iw_window_layout_party.xml", false, false);
		var hLeftButton = CreateButton(hHeaderPanel, "WindowLeftButton", null, "ui/window/iw_window_left_button");
		var hRightButton = CreateButton(hHeaderPanel, "WindowRightButton", null, "ui/window/iw_window_right_button");
	}
	else if (nHeaderMask == WINDOW_OPTION_TRADE) 
	{
		var hHeaderPanel = $.CreatePanel("Panel", hPanel, "WindowHeaderPanel");
		hHeaderPanel.BLoadLayout("file://{resources}/layout/custom_game/ui/iw_window_layout_trade.xml", false, false);
		var hLeftButton = CreateButton(hHeaderPanel, "WindowLeftButton", null, "ui/window/iw_window_left_button");
		var hRightButton = CreateButton(hHeaderPanel, "WindowRightButton", null, "ui/window/iw_window_right_button");
	}

	RegisterCustomEventHandler(hPanel, "WindowOpen", OnWindowOpen);
	RegisterCustomEventHandler(hPanel, "WindowClose", OnWindowClose);
	RegisterCustomEventHandler(hPanel, "WindowToggle", OnWindowToggle);
	RegisterCustomEventHandler(hPanel, "WindowFocus", OnWindowFocus);
	RegisterCustomEventHandler(hPanel, "WindowTabForward", OnWindowTabForward);
	RegisterCustomEventHandler(hPanel, "WindowTabBackward", OnWindowTabBackward);
	RegisterCustomEventHandler(hPanel, "ButtonActivate", OnWindowButtonActivate);
	
	hPanel.SetPanelEvent("onfocus", DispatchCustomEvent.bind(this, hPanel, "WindowFocus"));
	hPanel.SetPanelEvent("oncancel", DispatchCustomEvent.bind(this, hPanel, "WindowClose"));
	hPanel.SetPanelEvent("onactivate", DispatchCustomEvent.bind(this, hPanel, "WindowFocus"));
	hPanel.SetPanelEvent("ontabforward", DispatchCustomEvent.bind(this, hPanel, "WindowTabForward"));
	hPanel.SetPanelEvent("ontabbackward", DispatchCustomEvent.bind(this, hPanel, "WindowTabBackward"));
	
	return hPanel;
}