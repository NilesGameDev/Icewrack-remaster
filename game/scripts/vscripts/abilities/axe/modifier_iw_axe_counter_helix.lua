modifier_iw_axe_counter_helix = class({})

function modifier_iw_axe_counter_helix:DeclareExtEvents()
	local funcs =
	{
		[IW_MODIFIER_EVENT_ON_EXECUTE_ORDER] = 1,
	}
	return funcs
end

function modifier_iw_axe_counter_helix:OnCreated(args)
	if IsServer() then
		local hEntity = self:GetParent()
		local hCaster = self:GetCaster()
		local hAbility = self:GetAbility()
		local hDummy = CreateDummyUnit(hEntity:GetAbsOrigin(), hCaster:GetOwner(), hCaster:GetTeamNumber(), true)
		hDummy:SetMoveCapability(DOTA_UNIT_CAP_MOVE_GROUND)
		hDummy:SetBaseMoveSpeed(hEntity:GetMoveSpeedModifier(hEntity:GetBaseMoveSpeed()))
		hDummy:SetHullRadius(hEntity:GetHullRadius())
		hDummy:SetThink(function()
			local target = hDummy._target
			if type(target) == "userdata" then
				hDummy:MoveToPosition(target)
			elseif IsInstanceOf(target, CDOTA_BaseNPC) then
				hDummy:MoveToNPC(target)
			end
			--DebugDrawSphere(hDummy:GetAbsOrigin(), Vector(255, 0, 0), 128.0, 32.0, true, 0.1)
			--CreateAvoidanceZone(hDummy:GetAbsOrigin(), hAbility:GetAOERadius() + 64.0, args.avoidance, 0.1)
			CAvoidanceZone(hDummy:GetAbsOrigin(), hAbility:GetAOERadius() + 32.0, args.avoidance, 0.1)
			hEntity:SetAbsOrigin(hDummy:GetAbsOrigin())
			hEntity:SetForwardVector(hDummy:GetForwardVector())
			return 0.1
		end)
		self._hMoveDummy = hDummy
	end
end

function modifier_iw_axe_counter_helix:OnDestroy()
	if IsServer() then
		local hEntity = self:GetParent()
		--hEntity:Stop()
		self._hMoveDummy:RemoveSelf()
		
		local tLastOrder = self._tLastOrder
		if tLastOrder then
			self._bIsLastOrder = true
			hEntity:IssueOrder(tLastOrder.OrderType, tLastOrder.Target, nil, tLastOrder.Position, false)
		end
	end
end

function modifier_iw_axe_counter_helix:OnExecuteOrder(args)
	local hEntity = self:GetParent()
	local hDummy = self._hMoveDummy
	local tLastOrder = self._tLastOrder
	if self._bIsLastOrder then
		return true
	else
		if args.OrderType == DOTA_UNIT_ORDER_MOVE_TO_POSITION or args.OrderType == DOTA_UNIT_ORDER_ATTACK_MOVE then
			self._tLastOrder =
			{
				OrderType = args.OrderType,
				Position = args.Position,
			}
			hDummy._target = args.Position
			hEntity:SetHoldPosition(false)
			return false
		elseif args.OrderType == DOTA_UNIT_ORDER_MOVE_TO_TARGET or args.OrderType == DOTA_UNIT_ORDER_ATTACK_TARGET then
			local hTarget = EntIndexToHScript(args.TargetIndex)
			self._tLastOrder =
			{
				OrderType = args.OrderType,
				Target = hTarget,
			}
			hDummy._target = hTarget
			hEntity:SetHoldPosition(false)
			return false
		else
			self._tLastOrder = nil
			return true
		end
	end
end
