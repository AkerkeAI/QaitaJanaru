from datetime import datetime

from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, UniqueConstraint

from app.db.session import Base


class PartnerQrBranchReward(Base):
    __tablename__ = "partner_qr_branch_rewards"
    __table_args__ = (
        UniqueConstraint("branch_id", "reward_id", name="uq_partner_qr_branch_reward"),
    )

    id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(
        Integer, ForeignKey("partner_qr_branches.id"), nullable=False, index=True
    )
    reward_id = Column(
        String, ForeignKey("partner_qr_rewards.id"), nullable=False, index=True
    )
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
