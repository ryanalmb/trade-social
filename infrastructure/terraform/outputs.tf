# =============================================================================
# TERRAFORM OUTPUTS
# =============================================================================

# =============================================================================
# NETWORK OUTPUTS
# =============================================================================

output "vpc_id" {
  description = "ID of the VPC"
  value       = aws_vpc.main.id
}

output "vpc_cidr_block" {
  description = "CIDR block of the VPC"
  value       = aws_vpc.main.cidr_block
}

output "public_subnet_ids" {
  description = "IDs of the public subnets"
  value       = aws_subnet.public[*].id
}

output "private_subnet_ids" {
  description = "IDs of the private subnets"
  value       = aws_subnet.private[*].id
}

output "database_subnet_ids" {
  description = "IDs of the database subnets"
  value       = aws_subnet.database[*].id
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway"
  value       = aws_internet_gateway.main.id
}

output "nat_gateway_ids" {
  description = "IDs of the NAT Gateways"
  value       = aws_nat_gateway.main[*].id
}

# =============================================================================
# SECURITY GROUP OUTPUTS
# =============================================================================

output "alb_security_group_id" {
  description = "ID of the ALB security group"
  value       = aws_security_group.alb.id
}

output "ecs_security_group_id" {
  description = "ID of the ECS security group"
  value       = aws_security_group.ecs.id
}

output "rds_security_group_id" {
  description = "ID of the RDS security group"
  value       = aws_security_group.rds.id
}

output "elasticache_security_group_id" {
  description = "ID of the ElastiCache security group"
  value       = aws_security_group.elasticache.id
}

# =============================================================================
# DATABASE OUTPUTS
# =============================================================================

output "rds_endpoint" {
  description = "RDS instance endpoint"
  value       = aws_db_instance.main.endpoint
  sensitive   = true
}

output "rds_port" {
  description = "RDS instance port"
  value       = aws_db_instance.main.port
}

output "rds_database_name" {
  description = "RDS database name"
  value       = aws_db_instance.main.db_name
}

output "rds_username" {
  description = "RDS master username"
  value       = aws_db_instance.main.username
  sensitive   = true
}

output "timescale_endpoint" {
  description = "TimescaleDB instance endpoint"
  value       = aws_db_instance.timescale.endpoint
  sensitive   = true
}

output "timescale_port" {
  description = "TimescaleDB instance port"
  value       = aws_db_instance.timescale.port
}

output "redis_endpoint" {
  description = "ElastiCache Redis endpoint"
  value       = aws_elasticache_cluster.main.cache_nodes[0].address
  sensitive   = true
}

output "redis_port" {
  description = "ElastiCache Redis port"
  value       = aws_elasticache_cluster.main.cache_nodes[0].port
}

# =============================================================================
# ECS OUTPUTS
# =============================================================================

output "ecs_cluster_id" {
  description = "ID of the ECS cluster"
  value       = aws_ecs_cluster.main.id
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "ecs_task_execution_role_arn" {
  description = "ARN of the ECS task execution role"
  value       = aws_iam_role.ecs_task_execution.arn
}

output "ecs_task_role_arn" {
  description = "ARN of the ECS task role"
  value       = aws_iam_role.ecs_task.arn
}

# =============================================================================
# LOAD BALANCER OUTPUTS
# =============================================================================

output "alb_dns_name" {
  description = "DNS name of the load balancer"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "Zone ID of the load balancer"
  value       = aws_lb.main.zone_id
}

output "alb_arn" {
  description = "ARN of the load balancer"
  value       = aws_lb.main.arn
}

output "telegram_bot_target_group_arn" {
  description = "ARN of the Telegram bot target group"
  value       = aws_lb_target_group.telegram_bot.arn
}

output "web_app_target_group_arn" {
  description = "ARN of the web app target group"
  value       = aws_lb_target_group.web_app.arn
}

output "trading_engine_target_group_arn" {
  description = "ARN of the trading engine target group"
  value       = aws_lb_target_group.trading_engine.arn
}

# =============================================================================
# SECRETS OUTPUTS
# =============================================================================

output "db_password_secret_arn" {
  description = "ARN of the database password secret"
  value       = aws_secretsmanager_secret.db_password.arn
  sensitive   = true
}

output "db_password_secret_name" {
  description = "Name of the database password secret"
  value       = aws_secretsmanager_secret.db_password.name
}

# =============================================================================
# CLOUDWATCH OUTPUTS
# =============================================================================

output "telegram_bot_log_group_name" {
  description = "Name of the Telegram bot log group"
  value       = aws_cloudwatch_log_group.telegram_bot.name
}

output "web_app_log_group_name" {
  description = "Name of the web app log group"
  value       = aws_cloudwatch_log_group.web_app.name
}

output "trading_engine_log_group_name" {
  description = "Name of the trading engine log group"
  value       = aws_cloudwatch_log_group.trading_engine.name
}

# =============================================================================
# GENERAL OUTPUTS
# =============================================================================

output "aws_region" {
  description = "AWS region"
  value       = var.aws_region
}

output "environment" {
  description = "Environment name"
  value       = var.environment
}

output "project_name" {
  description = "Project name"
  value       = var.project_name
}

output "name_prefix" {
  description = "Name prefix used for resources"
  value       = local.name_prefix
}

# =============================================================================
# CONNECTION STRINGS (FOR APPLICATIONS)
# =============================================================================

output "database_connection_info" {
  description = "Database connection information"
  value = {
    host     = aws_db_instance.main.endpoint
    port     = aws_db_instance.main.port
    database = aws_db_instance.main.db_name
    username = aws_db_instance.main.username
  }
  sensitive = true
}

output "timescale_connection_info" {
  description = "TimescaleDB connection information"
  value = {
    host     = aws_db_instance.timescale.endpoint
    port     = aws_db_instance.timescale.port
    database = aws_db_instance.timescale.db_name
    username = aws_db_instance.timescale.username
  }
  sensitive = true
}

output "redis_connection_info" {
  description = "Redis connection information"
  value = {
    host = aws_elasticache_cluster.main.cache_nodes[0].address
    port = aws_elasticache_cluster.main.cache_nodes[0].port
  }
  sensitive = true
}

# =============================================================================
# APPLICATION URLS
# =============================================================================

output "application_urls" {
  description = "Application URLs"
  value = {
    load_balancer = "http://${aws_lb.main.dns_name}"
    telegram_bot  = "http://${aws_lb.main.dns_name}/telegram"
    web_app       = "http://${aws_lb.main.dns_name}"
    trading_api   = "http://${aws_lb.main.dns_name}/api/trading"
  }
}
