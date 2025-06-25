# =============================================================================
# DATABASE INFRASTRUCTURE
# =============================================================================

# =============================================================================
# RDS SUBNET GROUP
# =============================================================================

resource "aws_db_subnet_group" "main" {
  name       = "${local.name_prefix}-db-subnet-group"
  subnet_ids = aws_subnet.database[*].id
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-subnet-group"
  })
}

# =============================================================================
# RDS PARAMETER GROUP
# =============================================================================

resource "aws_db_parameter_group" "main" {
  family = "postgres15"
  name   = "${local.name_prefix}-db-params"
  
  parameter {
    name  = "shared_preload_libraries"
    value = "pg_stat_statements"
  }
  
  parameter {
    name  = "log_statement"
    value = "all"
  }
  
  parameter {
    name  = "log_min_duration_statement"
    value = "1000"  # Log queries taking more than 1 second
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-params"
  })
}

# =============================================================================
# RDS INSTANCE
# =============================================================================

resource "random_password" "db_password" {
  length  = 32
  special = true
}

resource "aws_secretsmanager_secret" "db_password" {
  name                    = "${local.name_prefix}-db-password"
  description             = "Database password for crypto platform"
  recovery_window_in_days = 7
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-db-password"
  })
}

resource "aws_secretsmanager_secret_version" "db_password" {
  secret_id = aws_secretsmanager_secret.db_password.id
  secret_string = jsonencode({
    username = var.db_username
    password = random_password.db_password.result
  })
}

resource "aws_db_instance" "main" {
  identifier = "${local.name_prefix}-postgres"
  
  # Engine configuration
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = var.db_instance_class
  
  # Storage configuration
  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage
  storage_type          = "gp3"
  storage_encrypted     = var.enable_encryption
  
  # Database configuration
  db_name  = var.db_name
  username = var.db_username
  password = random_password.db_password.result
  port     = 5432
  
  # Network configuration
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false
  
  # Backup configuration
  backup_retention_period = var.backup_retention_period
  backup_window          = var.backup_window
  maintenance_window     = var.maintenance_window
  
  # High availability
  multi_az = var.enable_multi_az
  
  # Monitoring
  monitoring_interval                   = var.enable_enhanced_monitoring ? 60 : 0
  monitoring_role_arn                  = var.enable_enhanced_monitoring ? aws_iam_role.rds_enhanced_monitoring[0].arn : null
  performance_insights_enabled         = var.enable_performance_insights
  performance_insights_retention_period = var.enable_performance_insights ? 7 : null
  enabled_cloudwatch_logs_exports      = ["postgresql"]
  
  # Parameter group
  parameter_group_name = aws_db_parameter_group.main.name
  
  # Security
  deletion_protection = var.enable_deletion_protection
  skip_final_snapshot = !var.enable_deletion_protection
  final_snapshot_identifier = var.enable_deletion_protection ? "${local.name_prefix}-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}" : null
  
  # Auto minor version upgrade
  auto_minor_version_upgrade = true
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-postgres"
  })
  
  lifecycle {
    ignore_changes = [
      password,
      final_snapshot_identifier
    ]
  }
}

# =============================================================================
# RDS ENHANCED MONITORING ROLE
# =============================================================================

resource "aws_iam_role" "rds_enhanced_monitoring" {
  count = var.enable_enhanced_monitoring ? 1 : 0
  
  name = "${local.name_prefix}-rds-enhanced-monitoring"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "monitoring.rds.amazonaws.com"
        }
      }
    ]
  })
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-rds-enhanced-monitoring"
  })
}

resource "aws_iam_role_policy_attachment" "rds_enhanced_monitoring" {
  count = var.enable_enhanced_monitoring ? 1 : 0
  
  role       = aws_iam_role.rds_enhanced_monitoring[0].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonRDSEnhancedMonitoringRole"
}

# =============================================================================
# ELASTICACHE SUBNET GROUP
# =============================================================================

resource "aws_elasticache_subnet_group" "main" {
  name       = "${local.name_prefix}-cache-subnet-group"
  subnet_ids = aws_subnet.database[*].id
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-cache-subnet-group"
  })
}

# =============================================================================
# ELASTICACHE PARAMETER GROUP
# =============================================================================

resource "aws_elasticache_parameter_group" "main" {
  family = var.redis_parameter_group_name
  name   = "${local.name_prefix}-redis-params"
  
  parameter {
    name  = "maxmemory-policy"
    value = "allkeys-lru"
  }
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-redis-params"
  })
}

# =============================================================================
# ELASTICACHE REDIS CLUSTER
# =============================================================================

resource "aws_elasticache_cluster" "main" {
  cluster_id           = "${local.name_prefix}-redis"
  engine               = "redis"
  engine_version       = var.redis_engine_version
  node_type            = var.redis_node_type
  num_cache_nodes      = var.redis_num_cache_nodes
  parameter_group_name = aws_elasticache_parameter_group.main.name
  port                 = 6379
  
  # Network configuration
  subnet_group_name  = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.elasticache.id]
  
  # Security
  at_rest_encryption_enabled = var.enable_encryption
  transit_encryption_enabled = var.enable_encryption
  
  # Maintenance
  maintenance_window = "sun:05:00-sun:06:00"
  
  # Snapshots
  snapshot_retention_limit = 5
  snapshot_window         = "03:00-05:00"
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-redis"
  })
}

# =============================================================================
# TIMESCALEDB (SEPARATE RDS INSTANCE)
# =============================================================================

resource "aws_db_instance" "timescale" {
  identifier = "${local.name_prefix}-timescale"
  
  # Engine configuration
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = "db.t3.micro"  # Start small
  
  # Storage configuration
  allocated_storage     = 20
  max_allocated_storage = 100
  storage_type          = "gp3"
  storage_encrypted     = var.enable_encryption
  
  # Database configuration
  db_name  = "timeseries"
  username = "timescale_admin"
  password = random_password.db_password.result
  port     = 5432
  
  # Network configuration
  db_subnet_group_name   = aws_db_subnet_group.main.name
  vpc_security_group_ids = [aws_security_group.rds.id]
  publicly_accessible    = false
  
  # Backup configuration
  backup_retention_period = 7
  backup_window          = var.backup_window
  maintenance_window     = var.maintenance_window
  
  # High availability
  multi_az = false  # Start without Multi-AZ for cost optimization
  
  # Monitoring
  enabled_cloudwatch_logs_exports = ["postgresql"]
  
  # Parameter group
  parameter_group_name = aws_db_parameter_group.main.name
  
  # Security
  deletion_protection = false
  skip_final_snapshot = true
  
  # Auto minor version upgrade
  auto_minor_version_upgrade = true
  
  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-timescale"
    Purpose = "TimeSeries Data"
  })
  
  lifecycle {
    ignore_changes = [password]
  }
}
